import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import logger from 'koa-logger';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import fs from 'fs';

import config from './config.js';
import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';
import utilsRoutes from './routes/utils.js';
import taskRoutes from './routes/tasks.js';
import optionsRoutes from './routes/options.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = new Koa();
const publicRouter = new Router({ prefix: '/api/public' });
const apiRouter = new Router({ prefix: '/api' });

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
mongoose.connect(config.mongodb.uri, config.mongodb.options)
  .then(() => console.log('🗄️  Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(errorHandler);
app.use(logger());
app.use(bodyParser());

app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

// Mount API routes first
apiRouter.get('/', (ctx) => {
  ctx.body = 'Hello World (api)';
});

// Mount public routes
publicRouter.get('/', (ctx) => {
  ctx.body = 'Hello World (api/public)';
});

publicRouter.use('/tasks', taskRoutes.routes());
publicRouter.use('/options', optionsRoutes.routes());

// Mount all API routes
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());
app.use(publicRouter.routes());
app.use(publicRouter.allowedMethods());

// Mount other API routes
app.use(utilsRoutes.routes());
app.use(protectedRoutes.routes());
app.use(authRoutes.routes());

// Serve static files and handle SPA routing last
app.use(serve(path.join(__dirname, '..', 'public')));

// Handle SPA routing - serve index.html for all other routes
app.use(async (ctx, next) => {
  if (ctx.path.startsWith('/api')) {
    await next();
  } else {
    ctx.type = 'html';
    ctx.body = fs.createReadStream(path.join(__dirname, '..', 'public', 'index.html'));
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}); 