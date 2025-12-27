import Router from '@koa/router';
import { Song } from '../models/Song.js';
import { Show } from '../models/Show.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'songs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const router = new Router();

function normalizeSongKey(songname, artist) {
  return `${String(songname || '').trim().toLowerCase()}|${String(artist || '').trim().toLowerCase()}`;
}

function artistInitials(artist) {
  return String(artist || '')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

// Get deduped songs for a show across all performers (public endpoint)
// Returns one row per canonical song (songname+artist), with per-performer variants.
router.get('/show/:showId', async (ctx) => {
  try {
    const { showId } = ctx.params;
    const { search, onlyCommon } = ctx.query;

    const show = await Show.findById(showId).select('performer additionalPerformers');
    if (!show) {
      ctx.status = 404;
      ctx.body = { error: 'Show not found' };
      return;
    }

    const performerIds = [
      show.performer?.toString(),
      ...(show.additionalPerformers || []).map(p => p.toString())
    ].filter(Boolean);

    if (performerIds.length === 0) {
      ctx.body = [];
      return;
    }

    const query = { performer: { $in: performerIds } };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { songname: searchRegex },
        { artist: searchRegex },
        { tags: searchRegex }
      ];
    }

    const songs = await Song.find(query)
      .select('songname artist tags year key notes performer')
      .sort({ songname: 1, artist: 1 })
      .limit(500);

    const grouped = new Map();
    for (const song of songs) {
      const key = normalizeSongKey(song.songname, song.artist);
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          songname: song.songname,
          artist: song.artist,
          year: song.year,
          tags: new Set(),
          performers: new Set(),
          variants: []
        });
      }

      const group = grouped.get(key);
      (song.tags || []).forEach(t => group.tags.add(t));
      if (song.performer) group.performers.add(song.performer.toString());

      group.variants.push({
        performerId: song.performer?.toString() || null,
        songId: song._id.toString(),
        key: song.key || null,
        notes: song.notes || null,
        tags: song.tags || []
      });
    }

    const requiredCount = performerIds.length;
    let options = Array.from(grouped.values()).map(group => {
      const performers = Array.from(group.performers);
      const keysByPerformer = {};
      const songIdsByPerformer = {};
      for (const v of group.variants) {
        if (!v.performerId) continue;
        keysByPerformer[v.performerId] = v.key;
        songIdsByPerformer[v.performerId] = v.songId;
      }

      return {
        key: group.key, // canonical key for autocomplete
        text: `${group.songname} (${artistInitials(group.artist)})`,
        songname: group.songname,
        artist: group.artist,
        year: group.year,
        tags: Array.from(group.tags),
        performerCount: performers.length,
        isCommonToAllPerformers: performers.length === requiredCount,
        performers,
        keysByPerformer,
        songIdsByPerformer
      };
    });

    if (String(onlyCommon).toLowerCase() === 'true') {
      options = options.filter(o => o.isCommonToAllPerformers);
    }

    // Keep response stable/predictable for UI
    options.sort((a, b) => {
      const nameCmp = String(a.songname).localeCompare(String(b.songname));
      if (nameCmp !== 0) return nameCmp;
      return String(a.artist).localeCompare(String(b.artist));
    });

    ctx.body = options;
  } catch (error) {
    console.error('Error fetching show songs:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch show songs' };
  }
});

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

// Get all songs for authenticated user (my songs)
router.get('/my-songs', authenticateToken, async (ctx) => {
  try {
    const songs = await Song.find({ performer: ctx.state.user._id })
      .sort({ songname: 1, artist: 1 });

    const formattedSongs = songs.map(song => ({
      id: song._id.toString(),
      songname: song.songname,
      artist: song.artist,
      year: song.year,
      tags: song.tags || [],
      key: song.key,
      bpm: song.bpm,
      notes: song.notes,
      link1: song.link1,
      link2: song.link2,
      attachmentUrl: song.attachmentUrl,
      attachmentFilename: song.attachmentFilename
    }));

    ctx.body = formattedSongs;
  } catch (error) {
    console.error('Error fetching user songs:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch songs' };
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

// Upload song attachment
router.post('/upload', authenticateToken, async (ctx) => {
  return new Promise((resolve, reject) => {
    const uploadSingle = upload.single('attachment');
    
    uploadSingle(ctx.req, ctx.res, (err) => {
      if (err) {
        ctx.status = 400;
        ctx.body = { error: err.message };
        resolve();
        return;
      }

      if (!ctx.req.file) {
        ctx.status = 400;
        ctx.body = { error: 'No file uploaded' };
        resolve();
        return;
      }

      // Return file info
      ctx.body = {
        filename: ctx.req.file.filename,
        originalName: ctx.req.file.originalname,
        url: `/uploads/songs/${ctx.req.file.filename}`,
        size: ctx.req.file.size
      };
      resolve();
    });
  });
});

// Create new song (protected - authenticated users only)
router.post('/', authenticateToken, async (ctx) => {
  try {
    const { songname, artist, year, tags, key, bpm, notes, link1, link2, attachmentUrl, attachmentFilename } = ctx.request.body;
    
    const song = new Song({
      songname,
      artist,
      year,
      tags: tags || [],
      key,
      bpm,
      notes,
      link1,
      link2,
      attachmentUrl,
      attachmentFilename,
      performer: ctx.state.user._id
    });

    await song.save();
    ctx.status = 201;
    ctx.body = {
      id: song._id.toString(),
      songname: song.songname,
      artist: song.artist,
      year: song.year,
      tags: song.tags,
      key: song.key,
      bpm: song.bpm,
      notes: song.notes,
      link1: song.link1,
      link2: song.link2,
      attachmentUrl: song.attachmentUrl,
      attachmentFilename: song.attachmentFilename
    };
  } catch (error) {
    console.error('Error creating song:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to create song' };
  }
});

// Update song (protected - song owner only)
router.put('/:id', authenticateToken, async (ctx) => {
  try {
    const song = await Song.findById(ctx.params.id);
    if (!song) {
      ctx.status = 404;
      ctx.body = { error: 'Song not found' };
      return;
    }

    // Check ownership
    if (song.performer.toString() !== ctx.state.user._id.toString()) {
      ctx.status = 403;
      ctx.body = { error: 'You do not have permission to update this song' };
      return;
    }
    
    const { songname, artist, year, tags, key, bpm, notes, link1, link2, attachmentUrl, attachmentFilename } = ctx.request.body;
    
    song.songname = songname || song.songname;
    song.artist = artist || song.artist;
    song.year = year !== undefined ? year : song.year;
    song.tags = tags || song.tags;
    song.key = key !== undefined ? key : song.key;
    song.bpm = bpm !== undefined ? bpm : song.bpm;
    song.notes = notes !== undefined ? notes : song.notes;
    song.link1 = link1 !== undefined ? link1 : song.link1;
    song.link2 = link2 !== undefined ? link2 : song.link2;
    song.attachmentUrl = attachmentUrl !== undefined ? attachmentUrl : song.attachmentUrl;
    song.attachmentFilename = attachmentFilename !== undefined ? attachmentFilename : song.attachmentFilename;

    await song.save();
    ctx.body = {
      id: song._id.toString(),
      songname: song.songname,
      artist: song.artist,
      year: song.year,
      tags: song.tags,
      key: song.key,
      bpm: song.bpm,
      notes: song.notes,
      link1: song.link1,
      link2: song.link2,
      attachmentUrl: song.attachmentUrl,
      attachmentFilename: song.attachmentFilename
    };
  } catch (error) {
    console.error('Error updating song:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to update song' };
  }
});

// Delete song (protected - song owner only)
router.delete('/:id', authenticateToken, async (ctx) => {
  try {
    const song = await Song.findById(ctx.params.id);
    if (!song) {
      ctx.status = 404;
      ctx.body = { error: 'Song not found' };
      return;
    }

    // Check ownership
    if (song.performer.toString() !== ctx.state.user._id.toString()) {
      ctx.status = 403;
      ctx.body = { error: 'You do not have permission to delete this song' };
      return;
    }

    await song.deleteOne();
    ctx.body = { message: 'Song deleted successfully' };
  } catch (error) {
    console.error('Error deleting song:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to delete song' };
  }
});

export default router; 