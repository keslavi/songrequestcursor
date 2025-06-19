import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (ctx, next) => {
  try {
    const token = ctx.header.authorization?.replace('Bearer ', '');
    
    if (!token) {
      ctx.throw(401, 'Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      ctx.throw(401, 'User not found');
    }

    // Add user and role to state for route handlers
    ctx.state.user = user;
    ctx.state.userRole = user.role;
    await next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      ctx.throw(401, 'Invalid token');
    }
    throw err;
  }
};

export const requireRole = (roles) => async (ctx, next) => {
  if (!ctx.state.user) {
    ctx.throw(401, 'Authentication required');
  }

  if (!roles.includes(ctx.state.user.role)) {
    ctx.throw(403, 'Insufficient permissions');
  }

  await next();
}; 