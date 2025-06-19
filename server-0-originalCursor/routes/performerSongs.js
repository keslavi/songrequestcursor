import Router from '@koa/router';
import { auth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import User from '../models/User.js';
import csv from 'csv-parse';

const router = new Router();

// Get performer's song catalog
router.get('/',
  auth,
  requireRole(['performer']),
  async ctx => {
    const user = await User.findById(ctx.state.user.id);
    ctx.body = user.songs.sort((a, b) => 
      a.baseInfo.name.localeCompare(b.baseInfo.name)
    );
  }
);

// Search performer's songs
router.get('/search',
  auth,
  requireRole(['performer']),
  async ctx => {
    const { q } = ctx.query;
    if (!q) {
      ctx.throw(400, 'Search query is required');
    }

    const user = await User.findById(ctx.state.user.id);
    ctx.body = user.findSongs(q);
  }
);

// Add a song to performer's catalog
router.post('/',
  auth,
  requireRole(['performer']),
  validateBody({
    baseInfo: {
      type: 'object',
      required: true,
      properties: {
        name: { type: 'string', required: true },
        artist: { type: 'string', required: true },
        genre: { type: 'string' },
        year: { type: 'number' },
        duration: { type: 'number' }
      }
    },
    performerDetails: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        bpm: { type: 'number' },
        notes: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      }
    },
    availability: {
      type: 'object',
      properties: {
        restrictions: {
          type: 'object',
          properties: {
            daysOfWeek: { 
              type: 'array',
              items: { type: 'number', minimum: 0, maximum: 6 }
            },
            timeSlots: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  start: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                  end: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
                }
              }
            }
          }
        }
      }
    }
  }),
  async ctx => {
    const user = await User.findById(ctx.state.user.id);
    
    // Check for duplicate song
    const isDuplicate = user.songs.some(song => 
      song.baseInfo.name.toLowerCase() === ctx.request.body.baseInfo.name.toLowerCase() &&
      song.baseInfo.artist.toLowerCase() === ctx.request.body.baseInfo.artist.toLowerCase()
    );

    if (isDuplicate) {
      ctx.throw(400, 'This song is already in your catalog');
    }

    user.songs.push(ctx.request.body);
    await user.save();

    ctx.body = user.songs[user.songs.length - 1];
  }
);

// Bulk import songs from CSV
router.post('/bulk',
  auth,
  requireRole(['performer']),
  async ctx => {
    if (!ctx.request.files?.file) {
      ctx.throw(400, 'CSV file is required');
    }

    const file = ctx.request.files.file;
    const results = [];
    const errors = [];

    // Parse CSV
    const records = await new Promise((resolve, reject) => {
      const parser = csv({ columns: true, trim: true });
      const records = [];

      parser.on('readable', () => {
        let record;
        while ((record = parser.read())) {
          records.push(record);
        }
      });

      parser.on('error', reject);
      parser.on('end', () => resolve(records));

      parser.write(file.buffer);
      parser.end();
    });

    const user = await User.findById(ctx.state.user.id);

    // Process each record
    for (const record of records) {
      try {
        const songData = {
          baseInfo: {
            name: record.name,
            artist: record.artist,
            genre: record.genre,
            year: record.year ? parseInt(record.year) : undefined
          },
          performerDetails: {
            key: record.key,
            bpm: record.bpm ? parseInt(record.bpm) : undefined,
            notes: record.notes,
            tags: record.tags?.split(',').map(tag => tag.trim())
          }
        };

        // Check for duplicate
        const isDuplicate = user.songs.some(song => 
          song.baseInfo.name.toLowerCase() === songData.baseInfo.name.toLowerCase() &&
          song.baseInfo.artist.toLowerCase() === songData.baseInfo.artist.toLowerCase()
        );

        if (!isDuplicate) {
          user.songs.push(songData);
          results.push(songData);
        } else {
          errors.push({
            row: record,
            error: 'Song already exists in catalog'
          });
        }
      } catch (err) {
        errors.push({
          row: record,
          error: err.message
        });
      }
    }

    if (results.length > 0) {
      await user.save();
    }

    ctx.body = {
      success: results,
      errors
    };
  }
);

// Update a song in performer's catalog
router.patch('/:songId',
  auth,
  requireRole(['performer']),
  validateBody({
    baseInfo: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        artist: { type: 'string' },
        genre: { type: 'string' },
        year: { type: 'number' },
        duration: { type: 'number' }
      }
    },
    performerDetails: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        bpm: { type: 'number' },
        notes: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        isActive: { type: 'boolean' },
        customizations: {
          type: 'object',
          properties: {
            alternateArrangement: { type: 'boolean' },
            customLyrics: { type: 'string' }
          }
        }
      }
    },
    availability: {
      type: 'object',
      properties: {
        isAvailable: { type: 'boolean' },
        restrictions: {
          type: 'object',
          properties: {
            daysOfWeek: { 
              type: 'array',
              items: { type: 'number', minimum: 0, maximum: 6 }
            },
            timeSlots: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  start: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
                  end: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
                }
              }
            }
          }
        }
      }
    }
  }),
  async ctx => {
    const user = await User.findById(ctx.state.user.id);
    const song = user.songs.id(ctx.params.songId);

    if (!song) {
      ctx.throw(404, 'Song not found in your catalog');
    }

    // Update only provided fields
    if (ctx.request.body.baseInfo) {
      Object.assign(song.baseInfo, ctx.request.body.baseInfo);
    }
    if (ctx.request.body.performerDetails) {
      Object.assign(song.performerDetails, ctx.request.body.performerDetails);
    }
    if (ctx.request.body.availability) {
      Object.assign(song.availability, ctx.request.body.availability);
    }

    await user.save();
    ctx.body = song;
  }
);

// Delete a song from performer's catalog
router.delete('/:songId',
  auth,
  requireRole(['performer']),
  async ctx => {
    const user = await User.findById(ctx.state.user.id);
    const song = user.songs.id(ctx.params.songId);

    if (!song) {
      ctx.throw(404, 'Song not found in your catalog');
    }

    song.remove();
    await user.save();
    
    ctx.status = 204;
  }
);

export default router; 