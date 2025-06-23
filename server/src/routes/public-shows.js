import Router from '@koa/router';
import { Show } from '../models/Show.js';

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
      dateFrom: { $gte: new Date() },
      status: 'published'
    })
    .populate('performers', 'profile')
    .sort({ dateFrom: 1 })
    .limit(50);

    console.log(`Found ${shows.length} shows nearby`);
    
    // Debug: Check each condition separately
    const futureShows = await Show.find({ dateFrom: { $gte: new Date() } });
    console.log(`Shows with future dates: ${futureShows.length}`);
    
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
    const shows = await Show.find({}).populate('performers', 'profile');
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
        venue: show.venue
      }))
    };
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    ctx.status = 500;
    ctx.body = { message: error.message };
  }
});

// Get public show by ID
router.get('/:id', async (ctx) => {
  try {
    const show = await Show.findById(ctx.params.id)
      .populate('performers', 'profile');

    if (!show) {
      ctx.throw(404, 'Show not found');
    }

    // Return public view of show
    ctx.body = {
      id: show._id,
      name: show.name,
      date: show.date,
      description: show.description,
      status: show.status,
      venue: show.venue,
      performers: show.performers,
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