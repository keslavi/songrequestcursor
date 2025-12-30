import Router from '@koa/router';
import axios from 'axios';
import { getPlaceDetailsFromLink } from '../services/googleMaps.js';

const SERVER_ENV_KEYS = [
  'PORT',
  'NODE_ENV',
  'GOOGLE_MAPS_API_KEY',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_SECURE',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_FROM',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'CLIENT_URL'
];

const CLIENT_CONFIG_KEYS = {
  AUTH0_DOMAIN: 'VITE_AUTH0_DOMAIN',
  AUTH0_CLIENT_ID: 'VITE_AUTH0_CLIENT_ID',
  AUTH0_AUDIENCE: 'VITE_AUTH0_AUDIENCE',
  GOOGLE_MAPS_API_KEY: 'VITE_GOOGLE_MAPS_API_KEY',
  API_URL: 'VITE_API_URL',
  APP_ENV: 'VITE_APP_ENV'
};

const router = new Router({ prefix: '/api/utils' });

// Resolve shortened URL
router.get('/resolve-url', async (ctx) => {
  const { url } = ctx.query;
  
  if (!url) {
    ctx.throw(400, 'URL parameter is required');
  }

  try {
    console.log('🔗 Attempting to resolve URL:', url);
    
    const response = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const finalUrl = response.request.res.responseUrl || url;
    console.log('✅ Resolved URL:', finalUrl);
    
    ctx.body = {
      resolvedUrl: finalUrl
    };
  } catch (error) {
    console.error('❌ Error resolving URL:', error.message);
    ctx.throw(500, `Failed to resolve URL: ${error.message}`);
  }
});

// Get place details from Google Maps link
router.get('/place-details', async (ctx) => {
  const { url } = ctx.query;

  if (!url) {
    ctx.status = 400;
    ctx.body = { error: 'MissingURL', message: 'URL parameter is required' };
    return;
  }

  try {
    const placeDetails = await getPlaceDetailsFromLink(url);
    ctx.body = placeDetails;
  } catch (error) {
    console.error('❌ Error getting place details:', error.message);
    ctx.status = 400;
    ctx.body = {
      error: 'PlaceDetailsError',
      message: error.message || 'Failed to process Google Maps link.'
    };
  }
});

// Temporary: expose selected environment variables for troubleshooting
router.get('/env', async (ctx) => {
  const serverEnv = SERVER_ENV_KEYS.reduce((acc, key) => {
    acc[key] = Object.prototype.hasOwnProperty.call(process.env, key)
      ? process.env[key]
      : null;
    return acc;
  }, {});

  ctx.body = {
    server: serverEnv
  };
});

// Expose a subset of Vite client configuration variables for the frontend to consume
router.get('/client-config', async (ctx) => {
  const clientConfig = Object.entries(CLIENT_CONFIG_KEYS).reduce((acc, [key, envKey]) => {
    acc[key] = Object.prototype.hasOwnProperty.call(process.env, envKey)
      ? process.env[envKey]
      : null;
    return acc;
  }, {});

  const clientEnv = Object.entries(CLIENT_CONFIG_KEYS).reduce((acc, [, envKey]) => {
    acc[envKey] = Object.prototype.hasOwnProperty.call(process.env, envKey)
      ? process.env[envKey]
      : null;
    return acc;
  }, {});

  ctx.body = {
    client: clientConfig,
    clientEnv
  };
});

export default router; 