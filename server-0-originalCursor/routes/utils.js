import Router from '@koa/router';
import axios from 'axios';

const router = new Router();

// Resolve shortened URL
router.get('/resolve-url', async ctx => {
  const { url } = ctx.query;
  
  if (!url) {
    ctx.throw(400, 'URL parameter is required');
  }

  try {
    console.log('Attempting to resolve URL:', url);
    
    const response = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: null, // Accept any status code
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const finalUrl = response.request.res.responseUrl || url;
    console.log('Resolved URL:', finalUrl);
    
    ctx.body = {
      resolvedUrl: finalUrl
    };
  } catch (error) {
    console.error('Error resolving URL:', error.message);
    ctx.throw(500, `Failed to resolve URL: ${error.message}`);
  }
});

export default router; 