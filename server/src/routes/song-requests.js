import express from 'express';
import { Request } from '../models/Request.js';
import { Show } from '../models/Show.js';
import { Song } from '../models/Song.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Create a new song request (public endpoint)
router.post('/', async (req, res) => {
  try {
    const { showId, songs, dedication, tipAmount } = req.body;

    // Validate show exists and is accepting requests
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ error: 'Show not found' });
    }

    if (!show.isAcceptingRequests()) {
      return res.status(400).json({ error: 'Show is not accepting requests' });
    }

    // Validate songs array
    if (!songs || !Array.isArray(songs) || songs.length === 0) {
      return res.status(400).json({ error: 'At least one song is required' });
    }

    // Validate tip amount
    if (!tipAmount || tipAmount < 1 || tipAmount > 100) {
      return res.status(400).json({ error: 'Tip amount must be between 1 and 100' });
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
      user: req.user?.id || null, // Allow anonymous requests
      songs: processedSongs,
      dedication: dedication || '',
      tipAmount: tipAmount,
      status: 'pending'
    });

    await request.save();

    // Add request to show's requests array
    show.requests.push(request._id);
    await show.save();

    res.status(201).json(request.toPublic());
  } catch (error) {
    console.error('Error creating song request:', error);
    res.status(500).json({ error: error.message || 'Failed to create song request' });
  }
});

// Get requests for a show (protected - show participants only)
router.get('/show/:showId', auth, async (req, res) => {
  try {
    const { showId } = req.params;
    
    // Check if user has access to this show
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ error: 'Show not found' });
    }

    if (!show.hasAccess(req.user.id, req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to view requests for this show' });
    }

    const requests = await Request.find({ show: showId })
      .populate('user', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    res.json(requests.map(req => req.toPublic()));
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Update request status (protected - show participants only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, performerNotes } = req.body;

    const request = await Request.findById(id).populate('show');
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Check if user has access to this show
    if (!request.show.hasAccess(req.user.id, req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    request.status = status;
    if (performerNotes !== undefined) {
      request.performerNotes = performerNotes;
    }
    
    if (status === 'completed') {
      request.completedAt = new Date();
    }

    await request.save();
    res.json(request.toPublic());
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

// Get request by ID (protected - show participants only)
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('show');
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Check if user has access to this show
    if (!request.show.hasAccess(req.user.id, req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to view this request' });
    }

    res.json(request.toPublic());
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

export default router; 