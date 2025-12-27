import Router from '@koa/router';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validate.js';
import { Show } from '../models/Show.js';
import { User } from '../models/User.js';

const router = new Router({ prefix: '/api/shows' });

// Get show by ID (public view)
router.get('/:id', async (ctx) => {
  const show = await Show.findById(ctx.params.id)
    .populate('createdBy', 'profile')
    .populate('performer', 'profile')
    .populate('additionalPerformers', 'profile');

  if (!show) {
    ctx.throw(404, 'Show not found');
  }

  // Return public view of show
  ctx.body = {
    id: show._id,
    createdBy: show.createdBy,
    performer: show.performer,
    additionalPerformers: show.additionalPerformers,
    venue: show.venue,
    dateFrom: show.dateFrom,
    dateTo: show.dateTo,
    status: show.status,
    settings: show.settings
  };
});

// Get show details (authenticated)
router.get('/:id/details', authenticateToken, async (ctx) => {
  const show = await Show.findById(ctx.params.id)
    .populate('createdBy', 'profile')
    .populate('performer', 'profile')
    .populate('additionalPerformers', 'profile');

  if (!show) {
    ctx.throw(404, 'Show not found');
  }

  // Check access permissions
  if (!show.hasAccess(ctx.state.user._id, ctx.state.user.role)) {
    ctx.throw(403, 'You do not have access to this show');
  }

  // Return full show details
  ctx.body = show;
});

// Create new show (admin, performer, organizer)
router.post('/',
  authenticateToken,
  requireRole(['admin', 'performer', 'organizer']),
  validateRequest(schemas.show.create),
  async ctx => {
    const showData = ctx.request.body;
    console.log('ctx.state.user:', ctx.state.user);
    
    const user = await User.findById(ctx.state.user._id);
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: 'User not found' };
      return;
    }

    // Create show
    const show = new Show({
      ...showData,
      createdBy: user._id,
      performer: user._id, // Set the creator as the main performer
      additionalPerformers: showData.additionalPerformers || [] // Use from request body or empty array
    });

    await show.save();

    // Return created show
    ctx.body = await Show.findById(show._id)
      .populate('createdBy', 'profile')
      .populate('performer', 'profile')
      .populate('additionalPerformers', 'profile');
  }
);

// Update show (requires access)
router.patch('/:id',
  authenticateToken,
  validateRequest(schemas.show.update),
  async ctx => {
    const show = await Show.findById(ctx.params.id);

    if (!show) {
      ctx.throw(404, 'Show not found');
    }

    // Check access permissions
    if (!show.hasAccess(ctx.state.user._id, ctx.state.user.role)) {
      ctx.throw(403, 'You do not have access to this show');
    }

    // Don't allow updating completed or cancelled shows
    if (['completed', 'cancelled'].includes(show.status)) {
      ctx.throw(400, 'Cannot update completed or cancelled shows');
    }

    const updates = ctx.request.body;

    // Use atomic update to prevent race conditions during concurrent operations
    const updatedShow = await Show.findByIdAndUpdate(
      ctx.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'profile')
      .populate('performer', 'profile')
      .populate('additionalPerformers', 'profile');

    if (!updatedShow) {
      ctx.throw(404, 'Show not found after update');
    }

    ctx.body = updatedShow;
  }
);

// Get shows for authenticated user
router.get('/user/me',
  authenticateToken,
  async ctx => {
    let query = {};
    
    if (ctx.state.user.role === 'admin') {
      // Admins can see all shows
      query = {};
    } else {
      // Users can see shows they created, are the main performer, or are additional performers in
      query = {
        $or: [
          { createdBy: ctx.state.user._id },
          { performer: ctx.state.user._id },
          { additionalPerformers: ctx.state.user._id }
        ]
      };
    }

    const shows = await Show.find(query)
      .populate('createdBy', 'profile')
      .populate('performer', 'profile')
      .populate('additionalPerformers', 'profile')
      .sort({ dateFrom: -1 });

    ctx.body = shows;
  }
);

export default router; 