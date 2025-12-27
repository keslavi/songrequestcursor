import Router from '@koa/router';
import { Request } from '../models/Request.js';
import { Show } from '../models/Show.js';
import { Song } from '../models/Song.js';
import { User } from '../models/User.js';

const router = new Router();

// Create a new song request (public endpoint - no authentication required)
router.post('/', async (ctx) => {
  try {
    const { showId, songs, dedication, tipAmount, requesterPhone } = ctx.request.body;

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

    // Validate songs array - only 1 song per request
    if (!songs || !Array.isArray(songs) || songs.length !== 1) {
      ctx.status = 400;
      ctx.body = { error: 'Exactly one song is required per request' };
      return;
    }

    // Validate tip amount
    if (!tipAmount || tipAmount < 1 || tipAmount > 100) {
      ctx.status = 400;
      ctx.body = { error: 'Tip amount must be between 1 and 100' };
      return;
    }

    // Require phone for anonymous/public requests (used for tracking)
    const phoneDigits = String(requesterPhone || '').replace(/[^\d]/g, '');
    if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 15) {
      ctx.status = 400;
      ctx.body = { error: 'Valid phone number is required to submit a request' };
      return;
    }

    // Check if a user exists with this phone number
    // If phone doesn't exist in database, they are treated as a guest (role: guest)
    const existingUser = await User.findOne({
      $or: [
        { phoneNumber: phoneDigits },
        { 'profile.phoneNumber': phoneDigits }
      ]
    });

    // Note: No limit on number of requests per user - users can request as many songs as they wish
    // But only 1 song can be requested at a time (enforced above)

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
            key: existingSong.key || null,
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
            key: song.key || null,
            isCustom: true
          };
        }
      })
    );

    // Create the request
    // If user exists with this phone, link to their account
    // If phone doesn't exist in database, they are a guest (user: null)
    const request = new Request({
      show: showId,
      user: existingUser ? existingUser._id : null,
      requesterPhone: phoneDigits,
      songs: processedSongs,
      dedication: dedication || '',
      tipAmount: tipAmount,
      status: 'pending'
    });

    await request.save();

    // Add request to show's requests array atomically to prevent race conditions
    await Show.findByIdAndUpdate(
      showId,
      { $push: { requests: request._id } },
      { new: true }
    );

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
      .populate('performerResponses.performer', 'username profile.firstName profile.lastName')
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
    const { status, performerNotes, songKey } = ctx.request.body;

    // Validate status first
    const validStatuses = ['pending', 'playing', 'played', 'alternate', 'declined'];
    if (!validStatuses.includes(status)) {
      ctx.status = 400;
      ctx.body = { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
      return;
    }

    // TODO: Add authentication check for show participants

    // Build update object
    const updateFields = { status };
    if (performerNotes !== undefined) {
      updateFields.performerNotes = performerNotes;
    }
    if (songKey !== undefined) {
      updateFields['songs.0.key'] = songKey;
    }

    // Use atomic update to prevent race conditions during high concurrency
    // (50-100 users creating requests + performer updating statuses)
    const request = await Request.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('show');

    if (!request) {
      ctx.status = 404;
      ctx.body = { error: 'Request not found' };
      return;
    }

    ctx.body = request.toPublic();
  } catch (error) {
    console.error('Error updating request status:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to update request status' };
  }
});

// Performer accept/pass action (public endpoint for now, should be protected)
router.patch('/:id/performer-action', async (ctx) => {
  try {
    const { id } = ctx.params;
    const { performerId, action } = ctx.request.body;

    // Validate action
    if (!['accept', 'pass'].includes(action)) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid action. Must be "accept" or "pass"' };
      return;
    }

    if (!performerId) {
      ctx.status = 400;
      ctx.body = { error: 'Performer ID is required' };
      return;
    }

    // Get the request and populate show with performers
    const request = await Request.findById(id).populate({
      path: 'show',
      populate: [
        { path: 'performer' },
        { path: 'additionalPerformers' }
      ]
    });

    if (!request) {
      ctx.status = 404;
      ctx.body = { error: 'Request not found' };
      return;
    }

    // Verify performer is part of the show
    const allPerformers = [
      request.show.performer._id.toString(),
      ...request.show.additionalPerformers.map(p => p._id.toString())
    ];

    if (!allPerformers.includes(performerId.toString())) {
      ctx.status = 403;
      ctx.body = { error: 'You are not a performer for this show' };
      return;
    }

    // Only allow actions on pending requests
    if (request.status !== 'pending') {
      ctx.status = 400;
      ctx.body = { error: 'Can only accept/pass on pending requests' };
      return;
    }

    // Remove any existing response from this performer and add the new one atomically
    const updatedRequest = await Request.findByIdAndUpdate(
      id,
      {
        $pull: { performerResponses: { performer: performerId } },
      },
      { new: false }
    );

    // Add the new response
    const finalRequest = await Request.findByIdAndUpdate(
      id,
      {
        $push: {
          performerResponses: {
            performer: performerId,
            response: action,
            respondedAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    ).populate({
      path: 'show',
      populate: [
        { path: 'performer' },
        { path: 'additionalPerformers' }
      ]
    }).populate('performerResponses.performer', 'username profile.firstName profile.lastName');

    // Note: accept/pass do NOT change the status
    // Status changes are separate (pending → playing/alternate/declined)

    ctx.body = finalRequest.toPublic();
  } catch (error) {
    console.error('Error updating performer action:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to update performer action' };
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