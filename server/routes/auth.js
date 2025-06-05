import Router from '@koa/router';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateBody } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';

const router = new Router();

// Register new user
router.post('/register',
  validateBody({
    email: { type: 'string', format: 'email', required: true },
    password: { type: 'string', minLength: 8, required: true },
    role: { type: 'string', enum: ['performer', 'guest'], required: true },
    profile: {
      type: 'object',
      required: true,
      properties: {
        name: { type: 'string', required: true },
        venmoUsername: { type: 'string' },
        bio: { type: 'string' },
        phone: { type: 'string' }
      }
    }
  }),
  async ctx => {
    const { email, password, role, profile } = ctx.request.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      ctx.throw(400, 'Email already registered');
    }

    // Create new user
    const user = new User({
      email,
      password,
      role,
      profile
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    ctx.body = {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      },
      token
    };
  }
);

// Login
router.post('/login',
  validateBody({
    email: { type: 'string', format: 'email', required: true },
    password: { type: 'string', required: true }
  }),
  async ctx => {
    const { email, password } = ctx.request.body;

    // Find user and verify password
    const user = await User.findOne({ email });
    if (!user || !(await user.verifyPassword(password))) {
      ctx.throw(401, 'Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    ctx.body = {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      },
      token
    };
  }
);

// Get current user
router.get('/me', auth, async ctx => {
  const user = ctx.state.user;
  
  ctx.body = {
    id: user._id,
    email: user.email,
    role: user.role,
    profile: user.profile,
    preferences: user.preferences
  };
});

// Update user profile
router.patch('/me',
  auth,
  validateBody({
    profile: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        venmoUsername: { type: 'string' },
        bio: { type: 'string' },
        phone: { type: 'string' }
      }
    },
    preferences: {
      type: 'object',
      properties: {
        notificationPreferences: {
          type: 'object',
          properties: {
            email: { type: 'boolean' },
            sms: { type: 'boolean' }
          }
        }
      }
    }
  }),
  async ctx => {
    const updates = ctx.request.body;
    const user = ctx.state.user;

    // Update only allowed fields
    if (updates.profile) {
      Object.assign(user.profile, updates.profile);
    }
    if (updates.preferences) {
      Object.assign(user.preferences, updates.preferences);
    }

    await user.save();

    ctx.body = {
      id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      preferences: user.preferences
    };
  }
);

export default router; 