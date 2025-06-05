import Router from '@koa/router';
import { auth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import Show from '../models/Show.js';
import User from '../models/User.js';

const router = new Router({ prefix: '/api/shows' });

// Get shows near a location (public)
router.get('/nearby', async (ctx) => {
  const { lat, lng, radius = 50 } = ctx.query; // radius in kilometers

  try {
    const shows = await Show.find({
      'venue.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      },
      dateTime: { $gte: new Date() },
      status: 'scheduled'
    })
    .populate('performer', 'profile')
    .sort({ dateTime: 1 })
    .limit(50);

    ctx.body = shows;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: error.message };
  }
});

// Get show by ID (public view)
router.get('/:id', async (ctx) => {
  const show = await Show.findById(ctx.params.id)
    .populate('performer', 'profile')
    .populate('managers', 'profile')
    .populate('additionalPerformers', 'profile');

  if (!show) {
    ctx.throw(404, 'Show not found');
  }

  // Return public view of show
  ctx.body = {
    id: show._id,
    performer: {
      id: show.performer._id,
      profile: show.performer.profile
    },
    venue: show.venue,
    dateTime: show.dateTime,
    duration: show.duration,
    status: show.status,
    settings: {
      requireTip: show.settings.requireTip,
      suggestedTipAmount: show.settings.suggestedTipAmount,
      allowExplicitSongs: show.settings.allowExplicitSongs
    }
  };
});

// Get show details (authenticated)
router.get('/:id/details', auth, async (ctx) => {
  const show = await Show.findById(ctx.params.id)
    .populate('performer', 'profile')
    .populate('managers', 'profile')
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

// Create new show (performers only)
router.post('/',
  auth,
  requireRole(['performer']),
  validateBody({
    venue: {
      type: 'object',
      required: true,
      properties: {
        name: { type: 'string', required: true },
        phone: { type: 'string' },
        mapUrl: { type: 'string' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zip: { type: 'string' }
          }
        },
        location: {
          type: 'object',
          required: true,
          properties: {
            coordinates: {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2,
              required: true
            }
          }
        }
      }
    },
    dateTime: { type: 'string', format: 'date-time', required: true },
    duration: { type: 'number', minimum: 30 },
    managers: { type: 'array', items: { type: 'string' } },
    additionalPerformers: { type: 'array', items: { type: 'string' } },
    settings: {
      type: 'object',
      properties: {
        maxRequestsPerUser: { type: 'number', minimum: 1 },
        requestTimeWindow: { type: 'number', minimum: 1 },
        autoApproveRequests: { type: 'boolean' },
        requireTip: { type: 'boolean' },
        suggestedTipAmount: { type: 'number', minimum: 0 },
        allowExplicitSongs: { type: 'boolean' }
      }
    }
  }),
  async ctx => {
    const showData = ctx.request.body;
    const performer = await User.findById(ctx.state.user.id);

    // Verify managers exist and have appropriate role
    if (showData.managers) {
      const managers = await User.find({
        _id: { $in: showData.managers },
        role: 'manager'
      });
      if (managers.length !== showData.managers.length) {
        ctx.throw(400, 'One or more managers are invalid');
      }
    }

    // Verify additional performers exist and have performer role
    if (showData.additionalPerformers) {
      const performers = await User.find({
        _id: { $in: showData.additionalPerformers },
        role: 'performer'
      });
      if (performers.length !== showData.additionalPerformers.length) {
        ctx.throw(400, 'One or more additional performers are invalid');
      }
    }

    // Get all active and available songs for the show time
    const availableSongs = performer.songs
      .filter(song => 
        song.performerDetails.isActive && 
        song.isAvailableForShow(showData.dateTime)
      )
      .map(song => song._id.toString());

    // Create show
    const show = new Show({
      ...showData,
      performer: performer._id,
      availableSongs
    });

    await show.save();

    // Return created show
    ctx.body = await Show.findById(show._id)
      .populate('performer', 'profile')
      .populate('managers', 'profile')
      .populate('additionalPerformers', 'profile');
  }
);

// Update show (requires access)
router.patch('/:id',
  auth,
  validateBody({
    venue: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        mapUrl: { type: 'string' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zip: { type: 'string' }
          }
        },
        location: {
          type: 'object',
          properties: {
            coordinates: {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2
            }
          }
        }
      }
    },
    dateTime: { type: 'string', format: 'date-time' },
    duration: { type: 'number', minimum: 30 },
    managers: { type: 'array', items: { type: 'string' } },
    additionalPerformers: { type: 'array', items: { type: 'string' } },
    status: { type: 'string', enum: ['scheduled', 'in-progress', 'completed', 'cancelled'] },
    settings: {
      type: 'object',
      properties: {
        maxRequestsPerUser: { type: 'number', minimum: 1 },
        requestTimeWindow: { type: 'number', minimum: 1 },
        autoApproveRequests: { type: 'boolean' },
        requireTip: { type: 'boolean' },
        suggestedTipAmount: { type: 'number', minimum: 0 },
        allowExplicitSongs: { type: 'boolean' }
      }
    }
  }),
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

    // Verify managers if being updated
    if (updates.managers) {
      const managers = await User.find({
        _id: { $in: updates.managers },
        role: 'manager'
      });
      if (managers.length !== updates.managers.length) {
        ctx.throw(400, 'One or more managers are invalid');
      }
    }

    // Verify additional performers if being updated
    if (updates.additionalPerformers) {
      const performers = await User.find({
        _id: { $in: updates.additionalPerformers },
        role: 'performer'
      });
      if (performers.length !== updates.additionalPerformers.length) {
        ctx.throw(400, 'One or more additional performers are invalid');
      }
    }

    // Update show
    Object.assign(show, updates);
    await show.save();

    // Return updated show
    ctx.body = await Show.findById(show._id)
      .populate('performer', 'profile')
      .populate('managers', 'profile')
      .populate('additionalPerformers', 'profile');
  }
);

// Get shows for authenticated user
router.get('/user/me',
  auth,
  async ctx => {
    let query = {};
    
    if (ctx.state.user.role === 'admin') {
      // Admins can see all shows
      query = {};
    } else if (ctx.state.user.role === 'manager') {
      // Managers can see shows where they are managers
      query = { managers: ctx.state.user._id };
    } else if (ctx.state.user.role === 'performer') {
      // Performers can see shows where they are the main performer or additional performer
      query = {
        $or: [
          { performer: ctx.state.user._id },
          { additionalPerformers: ctx.state.user._id }
        ]
      };
    }

    const shows = await Show.find(query)
      .populate('performer', 'profile')
      .populate('managers', 'profile')
      .populate('additionalPerformers', 'profile')
      .sort({ dateTime: -1 });

    ctx.body = shows;
  }
);

export default router; 