import Router from '@koa/router';
import { Song } from '../models/Song.js';

const router = new Router();

// Get all songs for a performer (for autocomplete) - public endpoint
router.get('/performer/:performerId', async (ctx) => {
  try {
    const { performerId } = ctx.params;
    const { search } = ctx.query;

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

    ctx.body = options;
  } catch (error) {
    console.error('Error fetching songs:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch songs' };
  }
});

// Search songs for autocomplete (public endpoint)
router.get('/search/:performerId', async (ctx) => {
  try {
    const { performerId } = ctx.params;
    const { q } = ctx.query;

    if (!q || q.length < 2) {
      ctx.body = [];
      return;
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

    ctx.body = options;
  } catch (error) {
    console.error('Error searching songs:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to search songs' };
  }
});

// Get song by ID (public endpoint)
router.get('/:id', async (ctx) => {
  try {
    const song = await Song.findById(ctx.params.id);
    if (!song) {
      ctx.status = 404;
      ctx.body = { error: 'Song not found' };
      return;
    }
    ctx.body = song.toPublic();
  } catch (error) {
    console.error('Error fetching song:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch song' };
  }
});

// Create new song (protected - performers only)
router.post('/', async (ctx) => {
  try {
    const { songname, artist, year, tags, key, notes } = ctx.request.body;
    
    // For now, we'll allow public creation but in production you'd want auth
    // TODO: Add authentication for song creation
    
    const song = new Song({
      songname,
      artist,
      year,
      tags: tags || [],
      key,
      notes,
      performer: ctx.request.body.performerId // This should come from auth in production
    });

    await song.save();
    ctx.status = 201;
    ctx.body = song.toPublic();
  } catch (error) {
    console.error('Error creating song:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to create song' };
  }
});

// Update song (protected - song owner only)
router.put('/:id', async (ctx) => {
  try {
    const song = await Song.findById(ctx.params.id);
    if (!song) {
      ctx.status = 404;
      ctx.body = { error: 'Song not found' };
      return;
    }

    // TODO: Add authentication check for song ownership
    
    const { songname, artist, year, tags, key, notes } = ctx.request.body;
    
    song.songname = songname || song.songname;
    song.artist = artist || song.artist;
    song.year = year || song.year;
    song.tags = tags || song.tags;
    song.key = key || song.key;
    song.notes = notes || song.notes;

    await song.save();
    ctx.body = song.toPublic();
  } catch (error) {
    console.error('Error updating song:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to update song' };
  }
});

// Delete song (protected - song owner only)
router.delete('/:id', async (ctx) => {
  try {
    const song = await Song.findById(ctx.params.id);
    if (!song) {
      ctx.status = 404;
      ctx.body = { error: 'Song not found' };
      return;
    }

    // TODO: Add authentication check for song ownership

    await song.deleteOne();
    ctx.body = { message: 'Song deleted successfully' };
  } catch (error) {
    console.error('Error deleting song:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to delete song' };
  }
});

export default router; 