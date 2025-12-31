import Router from '@koa/router';
import { PassThrough } from 'stream';
import { Request } from '../models/Request.js';
import { Show } from '../models/Show.js';
import { Song } from '../models/Song.js';
import { User } from '../models/User.js';
import { ShowGuest, PRIVATE_SHOW_JOIN_POINTS } from '../models/ShowGuest.js';

const sseClients = new Map();

const getShowKey = (showId) => {
  if (!showId) return null;
  return showId.toString();
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getPerformerIdsForShow = (show) => {
  if (!show) {
    return [];
  }

  const ids = [];

  const pushId = (value) => {
    if (!value) {
      return;
    }
    if (typeof value === 'object' && value._id) {
      ids.push(value._id.toString());
      return;
    }
    ids.push(value.toString());
  };

  pushId(show.performer);

  (show.additionalPerformers || []).forEach((performer) => {
    pushId(performer);
  });

  return ids;
};

const findSongForShow = async ({ songname, artist }, performerIds = []) => {
  const name = String(songname || '').trim();
  if (!name || !performerIds.length) {
    return null;
  }

  const query = {
    performer: { $in: performerIds },
    songname: new RegExp(`^${escapeRegex(name)}$`, 'i')
  };

  const trimmedArtist = String(artist || '').trim();
  if (trimmedArtist) {
    query.artist = new RegExp(`^${escapeRegex(trimmedArtist)}$`, 'i');
  }

  return Song.findOne(query).sort({ updatedAt: -1 }).lean();
};

const registerClient = (showId, client) => {
  const key = getShowKey(showId);
  if (!key) return;
  if (!sseClients.has(key)) {
    sseClients.set(key, new Set());
  }
  sseClients.get(key).add(client);
};

const removeClient = (showId, client) => {
  const key = getShowKey(showId);
  if (!key || !sseClients.has(key)) return;

  const clients = sseClients.get(key);
  if (!clients) return;

  clients.delete(client);

  if (!clients.size) {
    sseClients.delete(key);
  }
};

const sendEvent = (client, eventName, payload) => {
  client.stream.write(`event: ${eventName}\n`);
  client.stream.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const terminateClient = (showId, client) => {
  if (client.heartbeat) {
    clearInterval(client.heartbeat);
  }
  try {
    client.stream.end();
  } catch (error) {
    // stream may already be closed
  }
  removeClient(showId, client);
};

const getShowRequestsPayload = async (showId) => {
  const requests = await Request.find({ show: showId })
    .populate('user', 'username profile.firstName profile.lastName profile.stageName profile.name')
    .populate('performerResponses.performer', 'username profile.firstName profile.lastName profile.stageName profile.name')
    .sort({ createdAt: -1 });

  return requests.map((req) => req.toPublic());
};

const broadcastRequests = async (showId) => {
  const key = getShowKey(showId);
  const clients = key ? sseClients.get(key) : null;
  if (!clients || !clients.size) {
    return;
  }

  try {
    const payload = await getShowRequestsPayload(showId);
    const eventData = {
      requests: payload,
      emittedAt: new Date().toISOString()
    };

    for (const client of clients) {
      try {
        sendEvent(client, 'requests', eventData);
      } catch (error) {
        console.error('Failed to send SSE update, removing client:', error?.message || error);
        terminateClient(showId, client);
      }
    }
  } catch (error) {
    console.error('Error broadcasting request updates:', error?.message || error);
  }
};

const router = new Router();

// Create a new song request (public endpoint - no authentication required)
router.post('/', async (ctx) => {
  try {
    const {
      showId,
      songs,
      dedication,
      tipAmount,
      requesterPhone,
      requesterName,
      usePoints = false
    } = ctx.request.body;

    const isPointsRequest = Boolean(usePoints);

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

    if (isPointsRequest && show.showType !== 'private') {
      ctx.status = 400;
      ctx.body = { error: 'Points can only be used for private shows' };
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
    const phoneDigits = ShowGuest.normalizePhone(requesterPhone);
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

    const performerIds = getPerformerIdsForShow(show);

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
            key: song.key || existingSong.key || null,
            isCustom: false,
            link1: song.link1 || existingSong.link1 || null,
            link2: song.link2 || existingSong.link2 || null
          };
        } else {
          // Custom song entered by user
          const matchedSong = await findSongForShow(song, performerIds);

          if (matchedSong) {
            return {
              songId: matchedSong._id?.toString() || null,
              songname: matchedSong.songname,
              artist: matchedSong.artist || '',
              key: song.key || matchedSong.key || null,
              isCustom: false,
              link1: song.link1 || matchedSong.link1 || null,
              link2: song.link2 || matchedSong.link2 || null
            };
          }

          if (!song.songname) {
            throw new Error('Song name is required for custom songs');
          }
          return {
            songname: song.songname,
            artist: song.artist || '',
            key: song.key || null,
            isCustom: true,
            link1: song.link1 || null,
            link2: song.link2 || null
          };
        }
      })
    );

    // Create the request
    // If user exists with this phone, link to their account
    // If phone doesn't exist in database, they are a guest (user: null)
    const sanitizedName = typeof requesterName === 'string'
      ? requesterName.trim().slice(0, 120)
      : '';

    const roundedTipAmount = Math.round(tipAmount);

    let updatedGuest = null;

    if (isPointsRequest) {
      await ShowGuest.normalizeLegacyGuestName({ show: show._id, phoneNumber: phoneDigits });
      const setOps = {};
      if (sanitizedName) {
        setOps.guestName = sanitizedName;
      }

      const update = {
        $setOnInsert: {
          show: show._id,
          phoneNumber: phoneDigits,
          points: PRIVATE_SHOW_JOIN_POINTS
        }
      };

      if (Object.keys(setOps).length) {
        update.$set = setOps;
      } else {
        update.$setOnInsert.guestName = '';
      }

      const guestRecord = await ShowGuest.findOneAndUpdate(
        { show: show._id, phoneNumber: phoneDigits },
        update,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      const deductedGuest = await ShowGuest.findOneAndUpdate(
        {
          _id: guestRecord._id,
          points: { $gte: roundedTipAmount }
        },
        {
          $inc: { points: -roundedTipAmount },
          ...(sanitizedName ? { $set: { guestName: sanitizedName } } : {})
        },
        {
          new: true
        }
      );

      if (!deductedGuest) {
        ctx.status = 400;
        ctx.body = { error: 'Not enough points available' };
        return;
      }

      updatedGuest = deductedGuest;
    }

    const request = new Request({
      show: showId,
      user: existingUser ? existingUser._id : null,
      requesterPhone: phoneDigits,
      requesterName: sanitizedName,
      songs: processedSongs,
      dedication: dedication || '',
      tipAmount: roundedTipAmount,
      status: 'pending'
    });

    await request.save();

    // Add request to show's requests array atomically to prevent race conditions
    await Show.findByIdAndUpdate(
      showId,
      { $push: { requests: request._id } },
      { new: true }
    );

    const responsePayload = request.toPublic();

    if (updatedGuest) {
      delete responsePayload.venmoUrl;
      responsePayload.pointsBalance = updatedGuest.points;
      responsePayload.usedPoints = true;
    }

    ctx.status = 201;
    ctx.body = responsePayload;

    await broadcastRequests(showId);
  } catch (error) {
    console.error('Error creating song request:', error);
    ctx.status = 500;
    ctx.body = { error: error.message || 'Failed to create song request' };
  }
});

router.get('/show/:showId/events', async (ctx) => {
  const { showId } = ctx.params;

  try {
    const show = await Show.findById(showId);
    if (!show) {
      ctx.status = 404;
      ctx.body = { error: 'Show not found' };
      return;
    }

    ctx.req.setTimeout(0);

    const originHeader = ctx.get('Origin');
    const resolvedOrigin = originHeader || ctx.origin || '*';

    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': resolvedOrigin,
      'Access-Control-Allow-Credentials': 'true'
    });

    ctx.status = 200;

    const stream = new PassThrough();
    ctx.body = stream;

    if (ctx.res.flushHeaders) {
      ctx.res.flushHeaders();
    }

    if (ctx.req.socket) {
      ctx.req.socket.setNoDelay(true);
      ctx.req.socket.setKeepAlive(true);
    }

    const client = { stream };
    registerClient(showId, client);

    // initial comment to keep connection open
    stream.write(': connected\n\n');

    try {
      const initialPayload = await getShowRequestsPayload(showId);
      sendEvent(client, 'bootstrap', {
        requests: initialPayload,
        emittedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send initial SSE payload:', error?.message || error);
    }

    client.heartbeat = setInterval(() => {
      try {
        stream.write(': ping\n\n');
      } catch (error) {
        terminateClient(showId, client);
      }
    }, 30000);

    const cleanup = () => terminateClient(showId, client);

    ctx.req.on('close', cleanup);
    ctx.req.on('end', cleanup);
    ctx.res.on('close', cleanup);
  } catch (error) {
    console.error('Error establishing request stream:', error?.message || error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to establish event stream' };
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

    const requests = await getShowRequestsPayload(showId);

    ctx.body = requests;
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
  const validStatuses = ['pending', 'playing', 'add_to_request', 'played', 'alternate', 'declined'];
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

    const showIdForBroadcast = request.show?._id || request.show;
    if (showIdForBroadcast) {
      await broadcastRequests(showIdForBroadcast);
    }
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

    const showIdForBroadcast = finalRequest.show?._id || finalRequest.show;
    if (showIdForBroadcast) {
      await broadcastRequests(showIdForBroadcast);
    }
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