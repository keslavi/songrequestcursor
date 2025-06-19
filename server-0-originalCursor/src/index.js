import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import logger from 'koa-logger';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import config from './config.js';
import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';
import utilsRoutes from './routes/utils.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = new Koa();
const publicRouter = new Router({ prefix: '/api/public' });

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
mongoose.connect(config.mongodb.uri, config.mongodb.options)
  .then(() => console.log('🗄️  Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(logger((str) => {
  console.log(`🔍 ${str}`);
}));
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));
app.use(bodyParser());
app.use(errorHandler);

// Public API root endpoint
publicRouter.get('/', (ctx) => {
  ctx.body = 'Hello World';
});

// Mount routes
app.use(publicRouter.routes());
app.use(publicRouter.allowedMethods());
app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());
app.use(protectedRoutes.routes());
app.use(protectedRoutes.allowedMethods());
app.use(utilsRoutes.routes());
app.use(utilsRoutes.allowedMethods());

// Serve static files from the ui directory
app.use(serve(path.join(__dirname, '../../ui')));

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
}); 