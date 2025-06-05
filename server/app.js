import Koa from 'koa';
import Router from '@koa/router';
import mongoose from 'mongoose';
import cors from '@koa/cors';
import logger from 'koa-logger';
import helmet from 'koa-helmet';
import compress from 'koa-compress';
import bodyParser from 'koa-bodyparser';
import dotenv from 'dotenv';

import showRoutes from './routes/shows.js';
import requestRoutes from './routes/requests.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import performerSongRoutes from './routes/performerSongs.js';
import utilsRouter from './routes/utils.js';

dotenv.config();

const app = new Koa();
const router = new Router();

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      message: err.message || 'Something broke!',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    ctx.app.emit('error', err, ctx);
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(logger()); // Logging
app.use(compress()); // Compress responses
app.use(bodyParser()); // Parse JSON bodies

// Mount all routes
router.use('/api/auth', authRoutes.routes());
router.use('/api/users', userRoutes.routes());
router.use('/api/shows', showRoutes.routes());
router.use('/api/requests', requestRoutes.routes());
router.use('/api/performer/songs', performerSongRoutes.routes());
router.use('/api/utils', utilsRouter.routes());

// Register routes
app.use(router.routes());
app.use(router.allowedMethods());

// 404 handler
app.use(async (ctx) => {
  if (ctx.status === 404) {
    ctx.body = { message: 'Route not found' };
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; 