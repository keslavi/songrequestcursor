import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import config from '../config.js';

export const authenticateToken = async (ctx, next) => {
  try {
    const authHeader = ctx.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      ctx.status = 401;
      ctx.body = { message: 'Authentication token is required' };
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      ctx.status = 401;
      ctx.body = { message: 'User not found' };
      return;
    }

    ctx.user = user;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { message: 'Invalid or expired token' };
  }
};

export const requireAdmin = async (ctx, next) => {
  if (ctx.user.role !== 'admin') {
    ctx.status = 403;
    ctx.body = { message: 'Admin access required' };
    return;
  }
  await next();
}; 