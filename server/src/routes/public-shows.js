import Router from '@koa/router';
import { Show } from '../models/Show.js';
import { ShowGuest, PRIVATE_SHOW_JOIN_POINTS } from '../models/ShowGuest.js';

const router = new Router({ prefix: '/api/public/shows' });

// Get shows near a location (public)
router.get('/nearby', async (ctx) => {
  const { lat, lng, radius = 50 } = ctx.query; // radius in kilometers

  try {
    console.log('Nearby query params:', { lat, lng, radius });
    
    // First, let's see what shows exist in the database
    const allShows = await Show.find({});
    console.log(`Total shows in database: ${allShows.length}`);
    
    if (allShows.length > 0) {
      console.log('Sample show data:', {
        id: allShows[0]._id,
        name: allShows[0].name,
        dateFrom: allShows[0].dateFrom,
        dateTo: allShows[0].dateTo,
        status: allShows[0].status,
        hasVenue: !!allShows[0].venue,
        hasCoordinates: !!allShows[0].venue?.location?.coordinates,
        coordinates: allShows[0].venue?.location?.coordinates
      });
    }
    
    // Include shows up to 2 hours in the past
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const shows = await Show.find({
      'venue.location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      },
      dateFrom: { $gte: twoHoursAgo },
      status: 'published'
    })
    .populate('performer', 'profile')
    .populate('additionalPerformers', 'profile')
    .sort({ dateFrom: 1 })
    .limit(50);

    console.log(`Found ${shows.length} shows nearby`);
    
    // Debug: Check each condition separately
    const futureShows = await Show.find({ dateFrom: { $gte: twoHoursAgo } });
    console.log(`Shows with dates within last 2 hours: ${futureShows.length}`);
    
    const publishedShows = await Show.find({ status: 'published' });
    console.log(`Shows with published status: ${publishedShows.length}`);
    
    const showsWithCoordinates = await Show.find({ 'venue.location.coordinates': { $exists: true } });
    console.log(`Shows with coordinates: ${showsWithCoordinates.length}`);
    
    ctx.body = shows;
  } catch (error) {
    console.error('Error in nearby shows query:', error);
    ctx.status = 500;
    ctx.body = { message: error.message };
  }
});

// Debug endpoint to see all shows
router.get('/debug/all', async (ctx) => {
  try {
    const shows = await Show.find({})
      .populate('performer', 'profile')
      .populate('additionalPerformers', 'profile');
    ctx.body = {
      total: shows.length,
      shows: shows.map(show => ({
        id: show._id,
        name: show.name,
        dateFrom: show.dateFrom,
        dateTo: show.dateTo,
        status: show.status,
        hasVenue: !!show.venue,
        hasCoordinates: !!show.venue?.location?.coordinates,
        coordinates: show.venue?.location?.coordinates,
        venue: show.venue,
        performer: show.performer,
        additionalPerformers: show.additionalPerformers
      }))
    };
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    ctx.status = 500;
    ctx.body = { message: error.message };
  }
});

// Register or fetch points balance for a guest joining a private show
router.post('/:id/points', async (ctx) => {
  try {
    const show = await Show.findById(ctx.params.id);
    if (!show) {
      ctx.throw(404, 'Show not found');
    }

    if (show.showType !== 'private') {
      ctx.throw(400, 'Points are only available for private shows');
    }

    const { phoneNumber, guestName } = ctx.request.body || {};
    const digits = ShowGuest.normalizePhone(phoneNumber);

    if (!digits || digits.length < 10 || digits.length > 15) {
      ctx.throw(400, 'Valid phone number is required');
    }

    await ShowGuest.normalizeLegacyGuestName({ show: show._id, phoneNumber: digits });

    const sanitizedName = typeof guestName === 'string'
      ? guestName.trim().slice(0, 120)
      : '';

    const setOps = {};
    if (sanitizedName) {
      setOps.guestName = sanitizedName;
    }

    const update = {
      $setOnInsert: {
        show: show._id,
        phoneNumber: digits,
        points: PRIVATE_SHOW_JOIN_POINTS
      }
    };

    if (Object.keys(setOps).length) {
      update.$set = setOps;
    } else {
      update.$setOnInsert.guestName = '';
    }

    const guestRecord = await ShowGuest.findOneAndUpdate(
      { show: show._id, phoneNumber: digits },
      update,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    ctx.body = {
      points: guestRecord.points,
      guestName: guestRecord.guestName
    };
  } catch (error) {
    console.error('Error fetching guest points:', error);
    ctx.status = error.status || 500;
    ctx.body = { message: error.message || 'Failed to retrieve points' };
  }
});

// Get public show by ID
router.get('/:id', async (ctx) => {
  try {
    const show = await Show.findById(ctx.params.id)
      .populate('performer', 'profile')
      .populate('additionalPerformers', 'profile');

    if (!show) {
      ctx.throw(404, 'Show not found');
    }

    // Return public view of show
    ctx.body = {
      id: show._id,
      name: show.name,
      dateFrom: show.dateFrom,
      dateTo: show.dateTo,
      description: show.description,
      status: show.status,
      showType: show.showType,
      venue: show.venue,
      performer: show.performer,
      additionalPerformers: show.additionalPerformers,
      settings: {
        allowRequests: show.settings.allowRequests,
        maxRequestsPerUser: show.settings.maxRequestsPerUser,
        requestDeadline: show.settings.requestDeadline
      }
    };
  } catch (error) {
    console.error('Error getting public show:', error);
    ctx.status = 500;
    ctx.body = { message: error.message };
  }
});

export default router; 