import Router from '@koa/router';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import config from '../config.js';
import emailService from '../services/emailService.js';

const router = new Router({ prefix: '/api/public/auth' });

// Helper function to generate unique username
const generateUniqueUsername = async (baseUsername) => {
  let username = baseUsername;
  let counter = 1;
  
  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
};

// Register new user
router.post('/register', async (ctx) => {
  const { username, email, password, profile } = ctx.request.body;

  try {
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      ctx.status = 400;
      ctx.body = { message: 'Username or email already exists' };
      return;
    }

    // Validate password length
    if (password.length < 8) {
      ctx.status = 400;
      ctx.body = { message: 'Password must be at least 8 characters long' };
      return;
    }

    const user = new User({ 
      username, 
      email, 
      password,
      role: 'guest', // Default role
      profile: {
        ...profile,
        name: profile?.name || username
      }
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Send welcome email with name if available
    try {
      const displayName = profile?.firstName 
        ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
        : username;
      await emailService.sendWelcomeEmail(email, displayName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    ctx.body = {
      token,
      user: user.toProfile()
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = { message: error.message };
  }
});

// Login user
router.post('/login', async (ctx) => {
  const { email, password } = ctx.request.body;

  try {
    console.log('🔐 Login attempt for email:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      ctx.status = 401;
      ctx.body = { message: 'User not found' };
      return;
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      ctx.status = 401;
      ctx.body = { message: 'Invalid email or password' };
      return;
    }

    console.log('✅ Login successful for user:', email);

    const token = jwt.sign(
      { userId: user._id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    ctx.body = {
      token,
      user: user.toProfile()
    };
  } catch (error) {
    console.error('❌ Login error:', error);
    ctx.status = 500;
    ctx.body = { message: 'An error occurred during login' };
  }
});

// Request password reset
router.post('/forgot-password', async (ctx) => {
  const { email } = ctx.request.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: 'User not found' };
      return;
    }

    const resetToken = jwt.sign(
      { userId: user._id },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken, user.username);
      ctx.body = { message: 'Password reset email sent' };
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      ctx.status = 500;
      ctx.body = { message: 'Failed to send password reset email' };
    }
  } catch (error) {
    ctx.status = 400;
    ctx.body = { message: error.message };
  }
});

// Social authentication (Auth0)
router.post('/social', async (ctx) => {
  const { 
    provider, 
    token, 
    email, 
    name, 
    picture, 
    sub,
    phoneNumber,
    emailVerified,
    phoneNumberVerified,
    givenName,
    familyName,
    nickname,
    locale
  } = ctx.request.body;

  try {
    console.log('🔐 Social auth attempt for provider:', provider);
    
    if (!provider || !token) {
      ctx.status = 400;
      ctx.body = { message: 'Provider and token are required' };
      return;
    }

    // Extract user info from the request
    const userInfo = {
      email: email || 'user@example.com',
      name: name || 'Social User',
      picture: picture || null,
      sub: sub || `auth0|${Date.now()}`,
      phoneNumber: phoneNumber || null,
      emailVerified: emailVerified || false,
      phoneNumberVerified: phoneNumberVerified || false,
      givenName: givenName || null,
      familyName: familyName || null,
      nickname: nickname || null,
      locale: locale || null
    };

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: userInfo.email },
        { 'profile.auth0Id': userInfo.sub }
      ]
    });

    if (user) {
      console.log('✅ Existing user found:', user.email);
      
      // Update user profile with latest info
      user.profile = {
        ...user.profile,
        name: userInfo.name,
        picture: userInfo.picture,
        auth0Id: userInfo.sub,
        socialProvider: provider,
        lastSocialLogin: new Date(),
        phoneNumber: userInfo.phoneNumber,
        emailVerified: userInfo.emailVerified,
        phoneNumberVerified: userInfo.phoneNumberVerified,
        givenName: userInfo.givenName,
        familyName: userInfo.familyName,
        nickname: userInfo.nickname,
        locale: userInfo.locale
      };
      
      user.lastLogin = new Date();
      await user.save();
    } else {
      console.log('✅ Creating new user from social auth');
      
      // Create new user
      user = new User({
        username: await generateUniqueUsername(userInfo.email.split('@')[0]),
        email: userInfo.email,
        // No password for social auth users
        role: 'guest',
        profile: {
          name: userInfo.name,
          picture: userInfo.picture,
          auth0Id: userInfo.sub,
          socialProvider: provider,
          lastSocialLogin: new Date(),
          phoneNumber: userInfo.phoneNumber,
          emailVerified: userInfo.emailVerified,
          phoneNumberVerified: userInfo.phoneNumberVerified,
          givenName: userInfo.givenName,
          familyName: userInfo.familyName,
          nickname: userInfo.nickname,
          locale: userInfo.locale
        },
        lastLogin: new Date()
      });
      
      await user.save();
    }

    // Generate JWT token for your app
    const appToken = jwt.sign(
      { userId: user._id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    console.log('✅ Social auth successful for user:', user.email);
    console.log('📱 Phone number captured:', userInfo.phoneNumber);
    console.log('📧 Email verified:', userInfo.emailVerified);

    ctx.body = {
      token: appToken,
      user: user.toProfile()
    };
  } catch (error) {
    console.error('❌ Social auth error:', error);
    ctx.status = 500;
    ctx.body = { message: 'Social authentication failed' };
  }
});

// Get current user profile
router.get('/me', async (ctx) => {
  try {
    const authHeader = ctx.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      ctx.status = 401;
      ctx.body = { message: 'No token provided' };
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      ctx.status = 401;
      ctx.body = { message: 'User not found' };
      return;
    }

    ctx.body = user.toProfile();
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    ctx.status = 401;
    ctx.body = { message: 'Invalid token' };
  }
});

export default router; 