import Router from '@koa/router';
import { auth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import Show from '../models/Show.js';
import User from '../models/User.js';

const router = new Router();

// Get all upcoming shows (public)
router.get('/upcoming', async ctx => {
  const { lat, lng, distance } = ctx.query;
  
  let query = {
    dateTime: { $gte: new Date() },
    status: 'scheduled'
  };

  // If coordinates provided, find nearby shows
  if (lat && lng) {
    const coordinates = [parseFloat(lng), parseFloat(lat)];
    const maxDistance = parseInt(distance) || 10000; // default 10km

    query['venue.location'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: maxDistance
      }
    };
  }

  const shows = await Show.find(query)
    .populate('performer', 'profile.name profile.avatar')
    .sort({ dateTime: 1 });

  ctx.body = shows;
});

// Get show by ID (public)
router.get('/:id', async ctx => {
  const show = await Show.findById(ctx.params.id)
    .populate('performer');

  if (!show) {
    ctx.throw(404, 'Show not found');
  }

  // Get available songs with details
  const availableSongs = await show.getAvailableSongsWithDetails();

  // Format response
  ctx.body = {
    ...show.toObject(),
    performer: {
      id: show.performer._id,
      profile: show.performer.profile
    },
    availableSongs: availableSongs.map(song => ({
      id: song._id,
      baseInfo: song.baseInfo,
      performerDetails: {
        key: song.performerDetails.key,
        customizations: song.performerDetails.customizations
      }
    }))
  };
});

// Create new show (all authenticated users except guests)
router.post('/',
  auth,
  requireRole(['admin', 'manager', 'performer']),
  validateBody({
    venue: {
      type: 'object',
      required: true,
      properties: {
        name: { type: 'string', required: true },
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
    settings: {
      type: 'object',
      properties: {
        maxRequestsPerUser: { type: 'number', minimum: 1 },
        allowExplicitSongs: { type: 'boolean' }
      }
    }
  }),
  async ctx => {
    const showData = ctx.request.body;
    const performer = await User.findById(ctx.state.user.id);

    // Get all active and available songs for the show time
    const availableSongs = performer.songs
      .filter(song => 
        song.performerDetails.isActive && 
        song.isAvailableForShow(showData.dateTime)
      )
      .map(song => song._id.toString());

    // Create show with performer ID and available songs
    const show = new Show({
      ...showData,
      performer: performer._id,
      availableSongs
    });

    await show.save();

    // Format response
    ctx.body = {
      ...show.toObject(),
      performer: {
        id: performer._id,
        profile: performer.profile
      },
      availableSongs: availableSongs.map(songId => {
        const song = performer.songs.id(songId);
        return {
          id: song._id,
          baseInfo: song.baseInfo,
          performerDetails: {
            key: song.performerDetails.key,
            customizations: song.performerDetails.customizations
          }
        };
      })
    };
  }
);

// Update show (performer only)
router.patch('/:id',
  auth,
  requireRole(['performer']),
  validateBody({
    venue: {
      type: 'object',
      properties: {
        name: { type: 'string' },
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
    status: { type: 'string', enum: ['scheduled', 'in-progress', 'completed', 'cancelled'] },
    settings: {
      type: 'object',
      properties: {
        maxRequestsPerUser: { type: 'number', minimum: 1 },
        allowExplicitSongs: { type: 'boolean' }
      }
    }
  }),
  async ctx => {
    const show = await Show.findOne({
      _id: ctx.params.id,
      performer: ctx.state.user.id
    }).populate('performer');

    if (!show) {
      ctx.throw(404, 'Show not found');
    }

    // Don't allow updating completed or cancelled shows
    if (['completed', 'cancelled'].includes(show.status)) {
      ctx.throw(400, 'Cannot update completed or cancelled shows');
    }

    // If dateTime is being updated, we need to recheck song availability
    if (ctx.request.body.dateTime && ctx.request.body.dateTime !== show.dateTime.toISOString()) {
      const newDateTime = new Date(ctx.request.body.dateTime);
      const availableSongs = show.performer.songs
        .filter(song => 
          song.performerDetails.isActive && 
          song.isAvailableForShow(newDateTime)
        )
        .map(song => song._id.toString());
      
      show.availableSongs = availableSongs;
    }

    Object.assign(show, ctx.request.body);
    await show.save();

    // Get updated available songs with details
    const availableSongs = await show.getAvailableSongsWithDetails();

    // Format response
    ctx.body = {
      ...show.toObject(),
      performer: {
        id: show.performer._id,
        profile: show.performer.profile
      },
      availableSongs: availableSongs.map(song => ({
        id: song._id,
        baseInfo: song.baseInfo,
        performerDetails: {
          key: song.performerDetails.key,
          customizations: song.performerDetails.customizations
        }
      }))
    };
  }
);

// Update show's available songs
router.put('/:id/songs',
  auth,
  requireRole(['performer']),
  validateBody({
    songIds: {
      type: 'array',
      items: { type: 'string' },
      required: true
    }
  }),
  async ctx => {
    const show = await Show.findOne({
      _id: ctx.params.id,
      performer: ctx.state.user.id
    }).populate('performer');

    if (!show) {
      ctx.throw(404, 'Show not found');
    }

    // Verify all songs exist and are available for the show time
    const validSongs = show.performer.songs
      .filter(song => 
        ctx.request.body.songIds.includes(song._id.toString()) &&
        song.performerDetails.isActive &&
        song.isAvailableForShow(show.dateTime)
      );

    if (validSongs.length !== ctx.request.body.songIds.length) {
      ctx.throw(400, 'Some songs are not available or do not exist in your catalog');
    }

    show.availableSongs = validSongs.map(song => song._id.toString());
    await show.save();

    // Format response
    ctx.body = {
      ...show.toObject(),
      performer: {
        id: show.performer._id,
        profile: show.performer.profile
      },
      availableSongs: validSongs.map(song => ({
        id: song._id,
        baseInfo: song.baseInfo,
        performerDetails: {
          key: song.performerDetails.key,
          customizations: song.performerDetails.customizations
        }
      }))
    };
  }
);

// Get performer's shows
router.get('/performer/me',
  auth,
  requireRole(['performer']),
  async ctx => {
    const { status } = ctx.query;
    
    let query = { performer: ctx.state.user.id };
    
    if (status) {
      query.status = status;
    }

    const shows = await Show.find(query)
      .populate('performer')
      .sort({ dateTime: -1 });

    // Format response
    ctx.body = await Promise.all(shows.map(async show => {
      const availableSongs = await show.getAvailableSongsWithDetails();
      return {
        ...show.toObject(),
        performer: {
          id: show.performer._id,
          profile: show.performer.profile
        },
        availableSongs: availableSongs.map(song => ({
          id: song._id,
          baseInfo: song.baseInfo,
          performerDetails: {
            key: song.performerDetails.key,
            customizations: song.performerDetails.customizations
          }
        }))
      };
    }));
  }
);

// Cancel show
router.post('/:id/cancel',
  auth,
  requireRole(['performer']),
  async ctx => {
    const show = await Show.findOne({
      _id: ctx.params.id,
      performer: ctx.state.user.id
    });

    if (!show) {
      ctx.throw(404, 'Show not found');
    }

    if (show.status !== 'scheduled') {
      ctx.throw(400, 'Only scheduled shows can be cancelled');
    }

    show.status = 'cancelled';
    await show.save();

    ctx.body = show;
  }
);

// Start show
router.post('/:id/start',
  auth,
  requireRole(['performer']),
  async ctx => {
    const show = await Show.findOne({
      _id: ctx.params.id,
      performer: ctx.state.user.id
    });

    if (!show) {
      ctx.throw(404, 'Show not found');
    }

    if (show.status !== 'scheduled') {
      ctx.throw(400, 'Only scheduled shows can be started');
    }

    show.status = 'in-progress';
    await show.save();

    ctx.body = show;
  }
);

// End show
router.post('/:id/end',
  auth,
  requireRole(['performer']),
  async ctx => {
    const show = await Show.findOne({
      _id: ctx.params.id,
      performer: ctx.state.user.id
    });

    if (!show) {
      ctx.throw(404, 'Show not found');
    }

    if (show.status !== 'in-progress') {
      ctx.throw(400, 'Only in-progress shows can be ended');
    }

    show.status = 'completed';
    await show.save();

    ctx.body = show;
  }
);

export default router; 