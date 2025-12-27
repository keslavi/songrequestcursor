import Router from '@koa/router';
import { searchSongs } from '../services/spotifyService.js';

const router = new Router();

// Search songs via Spotify (public endpoint for autocomplete)
router.get('/search', async (ctx) => {
  try {
    const { q } = ctx.query;
    
    if (!q || q.length < 2) {
      ctx.body = [];
      return;
    }

    const results = await searchSongs(q);
    ctx.body = results;
  } catch (error) {
    console.error('Spotify search route error:', error);
    // Return empty array on error instead of 500
    ctx.body = [];
  }
});

export default router;

