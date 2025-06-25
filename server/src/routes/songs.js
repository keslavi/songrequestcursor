import express from 'express';
import { Song } from '../models/Song.js';
import { User } from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all songs for a performer (for autocomplete)
router.get('/performer/:performerId', async (req, res) => {
  try {
    const { performerId } = req.params;
    const { search } = req.query;

    let query = { performer: performerId };

    // Add search functionality for autocomplete
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { songname: searchRegex },
        { artist: searchRegex },
        { tags: searchRegex }
      ];
    }

    const songs = await Song.find(query)
      .select('songname artist tags year')
      .sort({ songname: 1 })
      .limit(50);

    // Format for autocomplete component
    const options = songs.map(song => ({
      key: song._id.toString(),
      text: song.getDisplayText(),
      songname: song.songname,
      artist: song.artist,
      tags: song.tags
    }));

    res.json(options);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// Search songs for autocomplete (public endpoint)
router.get('/search/:performerId', async (req, res) => {
  try {
    const { performerId } = req.params;
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchRegex = new RegExp(q, 'i');
    const songs = await Song.find({
      performer: performerId,
      $or: [
        { songname: searchRegex },
        { artist: searchRegex },
        { tags: searchRegex }
      ]
    })
      .select('songname artist tags year')
      .sort({ songname: 1 })
      .limit(20);

    // Format for autocomplete component
    const options = songs.map(song => ({
      key: song._id.toString(),
      text: song.getDisplayText(),
      songname: song.songname,
      artist: song.artist,
      tags: song.tags
    }));

    res.json(options);
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({ error: 'Failed to search songs' });
  }
});

// Get song by ID
router.get('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json(song.toPublic());
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ error: 'Failed to fetch song' });
  }
});

// Create new song (protected - performers only)
router.post('/', auth, async (req, res) => {
  try {
    const { songname, artist, year, tags, key, notes } = req.body;
    
    // Check if user is a performer
    const user = await User.findById(req.user.id);
    if (user.role !== 'performer') {
      return res.status(403).json({ error: 'Only performers can create songs' });
    }

    const song = new Song({
      songname,
      artist,
      year,
      tags: tags || [],
      key,
      notes,
      performer: req.user.id
    });

    await song.save();
    res.status(201).json(song.toPublic());
  } catch (error) {
    console.error('Error creating song:', error);
    res.status(500).json({ error: 'Failed to create song' });
  }
});

// Update song (protected - song owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Check if user owns the song
    if (song.performer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this song' });
    }

    const { songname, artist, year, tags, key, notes } = req.body;
    
    song.songname = songname || song.songname;
    song.artist = artist || song.artist;
    song.year = year || song.year;
    song.tags = tags || song.tags;
    song.key = key || song.key;
    song.notes = notes || song.notes;

    await song.save();
    res.json(song.toPublic());
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({ error: 'Failed to update song' });
  }
});

// Delete song (protected - song owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Check if user owns the song
    if (song.performer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this song' });
    }

    await song.remove();
    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ error: 'Failed to delete song' });
  }
});

export default router; 