import Router from '@koa/router';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { PhoneVerification } from '../models/PhoneVerification.js';
import config from '../config.js';
import emailService from '../services/emailService.js';
import smsService from '../services/smsService.js';
import bcrypt from 'bcryptjs';
import { seedDefaultSongsForPerformer } from '../services/performerSongSeeder.js';

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

const normalizePhoneNumber = (raw) => {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  const digits = trimmed.replace(/[^\d+]/g, '');

  // Keep leading + if present, otherwise strip to digits for normalization.
  const plusPrefixed = digits.startsWith('+') ? digits : digits.replace(/[^\d]/g, '');
  const cleanDigits = plusPrefixed.startsWith('+') ? plusPrefixed.slice(1).replace(/[^\d]/g, '') : plusPrefixed.replace(/[^\d]/g, '');

  if (!cleanDigits) return null;

  // Basic heuristic:
  // - If 10 digits, assume US and prefix +1
  // - Otherwise, prefix + and keep as-is (E.164-ish)
  if (cleanDigits.length === 10) return `+1${cleanDigits}`;
  if (cleanDigits.length < 10 || cleanDigits.length > 15) return null;
  return `+${cleanDigits}`;
};

const generateOtpCode = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const findOrCreateUserByPhone = async (normalized) => {
  let user = await User.findOne({
    $or: [{ phoneNumber: normalized }, { 'profile.phoneNumber': normalized }]
  });

  if (!user) {
    const last4 = normalized.slice(-4);
    const baseUsername = `user${last4}`;
    const username = await generateUniqueUsername(baseUsername);

    user = new User({
      username,
      phoneNumber: normalized,
      role: 'guest',
      profile: {
        name: username,
        phoneNumber: normalized,
        // No OTP verification in this flow.
        phoneNumberVerified: false
      },
      lastLogin: new Date()
    });
    await user.save();
    return user;
  }

  user.phoneNumber = user.phoneNumber || normalized;
  user.profile = {
    ...user.profile,
    phoneNumber: user.profile?.phoneNumber || normalized
  };
  user.lastLogin = new Date();
  await user.save();
  return user;
};

// Register new user
router.post('/register', async (ctx) => {
  const {
    username: rawUsername,
    email,
    password,
    profile: incomingProfile = {},
    stageName,
    venmoHandle,
    venmoConfirmDigits,
    contactEmail,
    contactPhone,
    description,
    headshotUrl,
  } = ctx.request.body || {};

  const username = rawUsername?.trim() || (typeof email === 'string' ? email.split('@')[0] : undefined);

  try {
    if (!username) {
      ctx.status = 400;
      ctx.body = { message: 'Username is required' };
      return;
    }

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

    const profileData = { ...incomingProfile };

    const normalizeString = (value) => {
      if (typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    };

    const preferredStageName = normalizeString(stageName) || normalizeString(incomingProfile?.stageName);
    if (preferredStageName) {
      profileData.stageName = preferredStageName;
      profileData.name = profileData.name || preferredStageName;
    }

    const profileDescription = normalizeString(description) || normalizeString(incomingProfile?.description);
    if (profileDescription) {
      profileData.description = profileDescription;
      profileData.bio = profileData.bio || profileDescription;
    }

    const normalizedHeadshot = normalizeString(headshotUrl) || normalizeString(incomingProfile?.headshotUrl);
    if (normalizedHeadshot) {
      profileData.headshotUrl = normalizedHeadshot;
      profileData.picture = profileData.picture || normalizedHeadshot;
    }

    const normalizedVenmoHandle = normalizeString(venmoHandle) || normalizeString(incomingProfile?.venmoHandle);
    if (normalizedVenmoHandle) {
      profileData.venmoHandle = normalizedVenmoHandle.startsWith('@')
        ? normalizedVenmoHandle
        : `@${normalizedVenmoHandle}`.replace(/^@@+/, '@');
    }

    const normalizedVenmoDigits = normalizeString(venmoConfirmDigits) || normalizeString(incomingProfile?.venmoConfirmDigits);
    if (normalizedVenmoDigits) {
      profileData.venmoConfirmDigits = normalizedVenmoDigits.replace(/[^0-9]/g, '').slice(-4);
    }

    const normalizedContactEmail = normalizeString(contactEmail) || normalizeString(incomingProfile?.contactEmail);
    if (normalizedContactEmail) {
      profileData.contactEmail = normalizedContactEmail.toLowerCase();
    }

    const normalizedContactPhone = normalizeString(contactPhone) || normalizeString(incomingProfile?.contactPhone);
    if (normalizedContactPhone) {
      profileData.contactPhone = normalizedContactPhone;
    }

    const isPerformerRegistration = Boolean(preferredStageName);

    const user = new User({ 
      username, 
      email, 
      password,
      role: isPerformerRegistration ? 'performer' : 'guest',
      profile: {
        ...profileData,
        name: profileData?.name || username
      }
    });
    await user.save();

    if (isPerformerRegistration) {
      try {
        // Seed the default ff2 set for every new performer account.
        const result = await seedDefaultSongsForPerformer(user._id);
        console.log(`Seeded default songs for performer ${user.username}`, result);
      } catch (seedError) {
        console.error('Failed to seed default songs for performer:', seedError);
      }
    }

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

// Phone: request verification code (OTP)
router.post('/phone/request-code', async (ctx) => {
  const { phoneNumber } = ctx.request.body || {};
  const normalized = normalizePhoneNumber(phoneNumber);

  if (!normalized) {
    ctx.status = 400;
    ctx.body = { message: 'Valid phoneNumber is required' };
    return;
  }

  const now = new Date();
  const resendCooldownMs = (config.sms?.verification?.resendCooldownSeconds || 30) * 1000;
  const ttlMs = (config.sms?.verification?.codeTtlMinutes || 10) * 60 * 1000;

  const existing = await PhoneVerification.findOne({ phoneNumber: normalized });
  if (existing?.lastSentAt && now - existing.lastSentAt < resendCooldownMs) {
    ctx.status = 429;
    ctx.body = { message: 'Please wait before requesting another code' };
    return;
  }

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(now.getTime() + ttlMs);

  await PhoneVerification.findOneAndUpdate(
    { phoneNumber: normalized },
    {
      phoneNumber: normalized,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await smsService.sendVerificationCode(normalized, code);

  ctx.body =
    config.nodeEnv !== 'production'
      ? { message: 'Verification code sent', phoneNumber: normalized, code }
      : { message: 'Verification code sent', phoneNumber: normalized };
});

// Phone: login with phone number only (no OTP verification)
router.post('/phone/login', async (ctx) => {
  const { phoneNumber } = ctx.request.body || {};
  const normalized = normalizePhoneNumber(phoneNumber);

  if (!normalized) {
    ctx.status = 400;
    ctx.body = { message: 'Valid phoneNumber is required' };
    return;
  }

  const user = await findOrCreateUserByPhone(normalized);

  const token = jwt.sign({ userId: user._id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });

  ctx.body = {
    token,
    user: user.toProfile()
  };
});

// Phone: verify code and login (auto-create user if needed)
router.post('/phone/verify', async (ctx) => {
  const { phoneNumber, code } = ctx.request.body || {};
  const normalized = normalizePhoneNumber(phoneNumber);
  const otp = String(code || '').trim();

  if (!normalized) {
    ctx.status = 400;
    ctx.body = { message: 'Valid phoneNumber is required' };
    return;
  }
  if (!/^\d{6}$/.test(otp)) {
    ctx.status = 400;
    ctx.body = { message: 'Valid 6-digit code is required' };
    return;
  }

  const record = await PhoneVerification.findOne({ phoneNumber: normalized });
  if (!record) {
    ctx.status = 400;
    ctx.body = { message: 'No verification code found. Please request a new code.' };
    return;
  }

  if (record.expiresAt < new Date()) {
    await PhoneVerification.deleteOne({ _id: record._id });
    ctx.status = 400;
    ctx.body = { message: 'Verification code expired. Please request a new code.' };
    return;
  }

  const maxAttempts = config.sms?.verification?.maxAttempts || 5;
  if ((record.attempts || 0) >= maxAttempts) {
    ctx.status = 429;
    ctx.body = { message: 'Too many attempts. Please request a new code.' };
    return;
  }

  const ok = await bcrypt.compare(otp, record.codeHash);
  if (!ok) {
    record.attempts = (record.attempts || 0) + 1;
    await record.save();
    ctx.status = 401;
    ctx.body = { message: 'Invalid code' };
    return;
  }

  await PhoneVerification.deleteOne({ _id: record._id });

  const user = await findOrCreateUserByPhone(normalized);
  user.profile = {
    ...user.profile,
    phoneNumberVerified: true
  };
  await user.save();

  const token = jwt.sign({ userId: user._id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });

  ctx.body = {
    token,
    user: user.toProfile()
  };
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