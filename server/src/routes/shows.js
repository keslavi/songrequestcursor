import Router from '@koa/router';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validate.js';
import { Show } from '../models/Show.js';
import { User } from '../models/User.js';

const router = new Router({ prefix: '/api/shows' });

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
router.get('/:id/details', authenticateToken, async (ctx) => {
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

// Create new show (admin, performer, organizer)
router.post('/',
  authenticateToken,
  requireRole(['admin', 'performer', 'organizer']),
  validateRequest(schemas.show.create),
  async ctx => {
    const showData = ctx.request.body;
    const user = await User.findById(ctx.state.user.id);

    // Create show
    const show = new Show({
      ...showData,
      createdBy: user._id,
      performers: [user._id] // Add the creator as a performer
    });

    await show.save();

    // Return created show
    ctx.body = await Show.findById(show._id)
      .populate('createdBy', 'profile')
      .populate('performers', 'profile');
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
  authenticateToken,
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