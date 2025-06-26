import Router from '@koa/router';
import { Request } from '../models/Request.js';
import { Show } from '../models/Show.js';
import { Song } from '../models/Song.js';

const router = new Router();

// Create a new song request (public endpoint - no authentication required)
router.post('/', async (ctx) => {
  try {
    const { showId, songs, dedication, tipAmount } = ctx.request.body;

    // Validate show exists and is accepting requests
    const show = await Show.findById(showId);
    if (!show) {
      ctx.status = 404;
      ctx.body = { error: 'Show not found' };
      return;
    }

    if (!show.isAcceptingRequests()) {
      ctx.status = 400;
      ctx.body = { error: 'Show is not accepting requests' };
      return;
    }

    // Validate songs array
    if (!songs || !Array.isArray(songs) || songs.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'At least one song is required' };
      return;
    }

    // Validate tip amount
    if (!tipAmount || tipAmount < 1 || tipAmount > 100) {
      ctx.status = 400;
      ctx.body = { error: 'Tip amount must be between 1 and 100' };
      return;
    }

    // Process songs - validate existing songs and format custom ones
    const processedSongs = await Promise.all(
      songs.map(async (song) => {
        if (song.songId) {
          // Existing song from database
          const existingSong = await Song.findById(song.songId);
          if (!existingSong) {
            throw new Error(`Song with ID ${song.songId} not found`);
          }
          return {
            songId: song.songId,
            songname: existingSong.songname,
            artist: existingSong.artist,
            isCustom: false
          };
        } else {
          // Custom song entered by user
          if (!song.songname) {
            throw new Error('Song name is required for custom songs');
          }
          return {
            songname: song.songname,
            artist: song.artist || '',
            isCustom: true
          };
        }
      })
    );

    // Create the request
    const request = new Request({
      show: showId,
      user: null, // Anonymous request
      songs: processedSongs,
      dedication: dedication || '',
      tipAmount: tipAmount,
      status: 'pending'
    });

    await request.save();

    // Add request to show's requests array
    show.requests.push(request._id);
    await show.save();

    ctx.status = 201;
    ctx.body = request.toPublic();
  } catch (error) {
    console.error('Error creating song request:', error);
    ctx.status = 500;
    ctx.body = { error: error.message || 'Failed to create song request' };
  }
});

// Get requests for a show (public endpoint for now, but could be protected)
router.get('/show/:showId', async (ctx) => {
  try {
    const { showId } = ctx.params;
    
    // Check if show exists
    const show = await Show.findById(showId);
    if (!show) {
      ctx.status = 404;
      ctx.body = { error: 'Show not found' };
      return;
    }

    const requests = await Request.find({ show: showId })
      .populate('user', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    ctx.body = requests.map(req => req.toPublic());
  } catch (error) {
    console.error('Error fetching requests:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch requests' };
  }
});

// Update request status (public endpoint for now, but should be protected in production)
router.patch('/:id/status', async (ctx) => {
  try {
    const { id } = ctx.params;
    const { status, performerNotes } = ctx.request.body;

    const request = await Request.findById(id).populate('show');
    if (!request) {
      ctx.status = 404;
      ctx.body = { error: 'Request not found' };
      return;
    }

    // TODO: Add authentication check for show participants

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid status' };
      return;
    }

    request.status = status;
    if (performerNotes !== undefined) {
      request.performerNotes = performerNotes;
    }
    
    if (status === 'completed') {
      request.completedAt = new Date();
    }

    await request.save();
    ctx.body = request.toPublic();
  } catch (error) {
    console.error('Error updating request status:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to update request status' };
  }
});

// Get request by ID (public endpoint)
router.get('/:id', async (ctx) => {
  try {
    const request = await Request.findById(ctx.params.id).populate('show');
    if (!request) {
      ctx.status = 404;
      ctx.body = { error: 'Request not found' };
      return;
    }

    ctx.body = request.toPublic();
  } catch (error) {
    console.error('Error fetching request:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch request' };
  }
});

export default router; 