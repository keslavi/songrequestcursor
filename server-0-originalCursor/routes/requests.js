import Router from '@koa/router';
import { auth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import Request from '../models/Request.js';
import Show from '../models/Show.js';

const router = new Router();

// Get request queue for a show (public)
router.get('/show/:showId/queue', async ctx => {
  const { showId } = ctx.params;
  const { status } = ctx.query;

  const queue = await Request.getShowQueue(
    showId, 
    status ? status.split(',') : undefined
  );

  // Get show to include available songs
  const show = await Show.findById(showId).populate('performer');
  const availableSongs = await show.getAvailableSongsWithDetails();

  // Format response
  ctx.body = {
    queue: queue.map(request => ({
      id: request._id,
      requester: {
        name: request.requester.profile.name
      },
      song: availableSongs.find(s => s._id.toString() === request.songId)?.baseInfo,
      status: request.status,
      requestedAt: request.requestedAt,
      scheduledTime: request.scheduledTime,
      specialRequests: request.specialRequests
    })),
    queueLength: queue.length
  };
});

// Create a new request
router.post('/',
  auth,
  validateBody({
    showId: { type: 'string', required: true },
    songId: { type: 'string', required: true },
    payment: {
      type: 'object',
      required: true,
      properties: {
        amount: { type: 'number', minimum: 0, required: true },
        venmoTransactionId: { type: 'string', required: true }
      }
    },
    specialRequests: {
      type: 'object',
      properties: {
        message: { type: 'string', maxLength: 200 },
        dedicatedTo: { type: 'string', maxLength: 100 }
      }
    }
  }),
  async ctx => {
    const { showId, songId, payment, specialRequests } = ctx.request.body;

    // Get show and verify it's active
    const show = await Show.findById(showId).populate('performer');
    if (!show) {
      ctx.throw(404, 'Show not found');
    }
    if (show.status !== 'in-progress') {
      ctx.throw(400, 'Show is not currently active');
    }

    // Check if song is available
    if (!(await show.isSongAvailable(songId))) {
      ctx.throw(400, 'Song is not available for request');
    }

    // Check if user can make more requests
    if (!(await Request.canUserRequest(showId, ctx.state.user.id))) {
      ctx.throw(400, 'Maximum request limit reached');
    }

    // TODO: Verify Venmo transaction

    // Create request
    const request = new Request({
      show: showId,
      requester: ctx.state.user.id,
      songId,
      payment: {
        amount: payment.amount,
        venmoTransactionId: payment.venmoTransactionId,
        status: 'completed' // Assuming Venmo verification passed
      },
      specialRequests,
      status: 'pending'
    });

    await request.save();

    // Update show statistics
    await show.updateStats({ 
      tip: payment.amount,
      status: request.status
    });

    // Get song details for response
    const song = show.performer.songs.id(songId);

    ctx.body = {
      id: request._id,
      status: request.status,
      song: {
        id: song._id,
        baseInfo: song.baseInfo
      },
      payment: request.payment,
      specialRequests: request.specialRequests,
      requestedAt: request.requestedAt
    };
  }
);

// Get user's requests for a show
router.get('/show/:showId/me',
  auth,
  async ctx => {
    const requests = await Request.find({
      show: ctx.params.showId,
      requester: ctx.state.user.id
    }).sort({ requestedAt: -1 });

    const show = await Show.findById(ctx.params.showId).populate('performer');
    const availableSongs = await show.getAvailableSongsWithDetails();

    ctx.body = requests.map(request => ({
      id: request._id,
      song: availableSongs.find(s => s._id.toString() === request.songId)?.baseInfo,
      status: request.status,
      requestedAt: request.requestedAt,
      scheduledTime: request.scheduledTime,
      payment: {
        amount: request.payment.amount,
        status: request.payment.status
      },
      specialRequests: request.specialRequests,
      performanceRating: request.performanceRating
    }));
  }
);

// Cancel a request
router.post('/:id/cancel',
  auth,
  async ctx => {
    const request = await Request.findOne({
      _id: ctx.params.id,
      requester: ctx.state.user.id
    });

    if (!request) {
      ctx.throw(404, 'Request not found');
    }

    if (!request.canBeCancelled()) {
      ctx.throw(400, 'Request cannot be cancelled');
    }

    await request.processRefund();
    ctx.body = { status: 'cancelled' };
  }
);

// Rate a completed request
router.post('/:id/rate',
  auth,
  validateBody({
    rating: { type: 'number', minimum: 1, maximum: 5, required: true },
    comment: { type: 'string', maxLength: 500 }
  }),
  async ctx => {
    const request = await Request.findOne({
      _id: ctx.params.id,
      requester: ctx.state.user.id
    });

    if (!request) {
      ctx.throw(404, 'Request not found');
    }

    if (request.status !== 'completed') {
      ctx.throw(400, 'Can only rate completed requests');
    }

    if (request.performanceRating?.rating) {
      ctx.throw(400, 'Request has already been rated');
    }

    request.performanceRating = {
      ...ctx.request.body,
      ratedAt: new Date()
    };

    await request.save();
    ctx.body = request.performanceRating;
  }
);

// Performer routes

// Get all requests for performer's show
router.get('/show/:showId/all',
  auth,
  requireRole(['performer']),
  async ctx => {
    const show = await Show.findOne({
      _id: ctx.params.showId,
      performer: ctx.state.user.id
    });

    if (!show) {
      ctx.throw(404, 'Show not found');
    }

    const requests = await Request.find({ show: show._id })
      .populate('requester', 'profile.name')
      .sort({ requestedAt: -1 });

    const availableSongs = await show.getAvailableSongsWithDetails();

    ctx.body = requests.map(request => ({
      id: request._id,
      requester: {
        id: request.requester._id,
        name: request.requester.profile.name
      },
      song: availableSongs.find(s => s._id.toString() === request.songId)?.baseInfo,
      status: request.status,
      requestedAt: request.requestedAt,
      scheduledTime: request.scheduledTime,
      payment: {
        amount: request.payment.amount,
        status: request.payment.status
      },
      specialRequests: request.specialRequests,
      performanceRating: request.performanceRating
    }));
  }
);

// Update request status
router.patch('/:id/status',
  auth,
  requireRole(['performer']),
  validateBody({
    status: { 
      type: 'string', 
      enum: ['approved', 'in-progress', 'completed', 'rejected'],
      required: true
    },
    scheduledTime: { type: 'string', format: 'date-time' },
    message: { type: 'string' }
  }),
  async ctx => {
    const { status, scheduledTime, message } = ctx.request.body;

    // Find request and verify show ownership
    const request = await Request.findById(ctx.params.id)
      .populate({
        path: 'show',
        match: { performer: ctx.state.user.id }
      });

    if (!request || !request.show) {
      ctx.throw(404, 'Request not found');
    }

    // Validate status transition
    const validTransitions = {
      pending: ['approved', 'rejected'],
      approved: ['in-progress', 'rejected'],
      'in-progress': ['completed']
    };

    if (!validTransitions[request.status]?.includes(status)) {
      ctx.throw(400, 'Invalid status transition');
    }

    // Update scheduled time if provided
    if (scheduledTime) {
      request.scheduledTime = new Date(scheduledTime);
    }

    // Update status with notification
    await request.updateStatus(status, message);

    ctx.body = {
      id: request._id,
      status: request.status,
      scheduledTime: request.scheduledTime,
      notifications: request.notifications
    };
  }
);

export default router; 