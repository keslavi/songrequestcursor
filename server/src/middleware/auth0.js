import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { User } from '../models/User.js';

// Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'https://your-api-identifier.com';

console.log('🔧 Auth0 Middleware Configuration:');
console.log('  Domain:', AUTH0_DOMAIN);
console.log('  Audience:', AUTH0_AUDIENCE);

// Create JWKS client for fetching public keys
const jwksClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
});

// Function to get signing key
const getSigningKey = (kid) => {
  return new Promise((resolve, reject) => {
    jwksClient.getSigningKey(kid, (err, key) => {
      if (err) {
        console.error('❌ JWKS Error:', err);
        reject(err);
      } else {
        const signingKey = key.publicKey || key.rsaPublicKey;
        console.log('✅ Got signing key for kid:', kid);
        resolve(signingKey);
      }
    });
  });
};

// Middleware to extract user from Auth0 token and find/create in database
export const authenticateUser = async (ctx, next) => {
  try {
    console.log('🔐 Auth0 Authentication Request:');
    console.log('  Path:', ctx.path);
    console.log('  Headers:', Object.keys(ctx.headers));
    
    const authHeader = ctx.headers.authorization;
    console.log('  Auth Header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('  Token Present:', !!token);
    console.log('  Token Length:', token ? token.length : 0);

    if (!token) {
      ctx.status = 401;
      ctx.body = { message: 'No token provided' };
      return;
    }

    // Decode token header to get key ID
    console.log('🔍 Decoding token header...');
    const decodedHeader = jwt.decode(token, { complete: true });
    console.log('  Decoded Header:', decodedHeader ? 'Success' : 'Failed');
    
    if (!decodedHeader) {
      console.error('❌ Token decode failed - invalid format');
      ctx.status = 401;
      ctx.body = { message: 'Invalid token format' };
      return;
    }

    console.log('  Token Header:', {
      alg: decodedHeader.header.alg,
      typ: decodedHeader.header.typ,
      kid: decodedHeader.header.kid
    });

    // Get the signing key from Auth0
    console.log('🔑 Fetching signing key for kid:', decodedHeader.header.kid);
    const signingKey = await getSigningKey(decodedHeader.header.kid);

    // Verify the JWT token
    console.log('✅ Verifying JWT token...');
    const auth0User = jwt.verify(token, signingKey, {
      audience: AUTH0_AUDIENCE,
      issuer: `https://${AUTH0_DOMAIN}/`,
      algorithms: ['RS256']
    });
    
    console.log('✅ Token verified successfully');
    console.log('  Auth0 User:', {
      sub: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name
    });
    
    // Find or create user in your database
    let user = await User.findOne({ 
      'profile.auth0Id': auth0User.sub 
    });

    if (!user) {
      console.log('👤 Creating new user from Auth0 data');
      // Create new user from Auth0 data
      user = new User({
        username: auth0User.email.split('@')[0], // You might want to make this unique
        email: auth0User.email,
        role: 'guest', // Default role
        profile: {
          name: auth0User.name,
          picture: auth0User.picture,
          auth0Id: auth0User.sub,
          emailVerified: auth0User.email_verified,
          givenName: auth0User.given_name,
          familyName: auth0User.family_name,
          nickname: auth0User.nickname,
          locale: auth0User.locale
        },
        lastLogin: new Date()
      });
      
      await user.save();
      console.log('✅ New user created:', user.email);
    } else {
      console.log('👤 Existing user found:', user.email);
      // Update existing user's last login
      user.lastLogin = new Date();
      await user.save();
    }

    // Attach user to context
    ctx.user = user;
    console.log('✅ Authentication successful for user:', user.email);
    await next();
  } catch (error) {
    console.error('❌ Auth0 authentication error:', error);
    console.error('  Error name:', error.name);
    console.error('  Error message:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      ctx.status = 401;
      ctx.body = { message: 'Invalid token signature' };
    } else if (error.name === 'TokenExpiredError') {
      ctx.status = 401;
      ctx.body = { message: 'Token expired' };
    } else if (error.name === 'NotBeforeError') {
      ctx.status = 401;
      ctx.body = { message: 'Token not yet valid' };
    } else {
      ctx.status = 401;
      ctx.body = { message: 'Authentication failed', error: error.message };
    }
  }
};

// Role-based authorization middleware
export const requireRole = (roles) => {
  return async (ctx, next) => {
    if (!ctx.user) {
      ctx.status = 401;
      ctx.body = { message: 'Authentication required' };
      return;
    }

    if (!roles.includes(ctx.user.role)) {
      ctx.status = 403;
      ctx.body = { message: 'Insufficient permissions' };
      return;
    }

    await next();
  };
};

// Admin-only middleware
export const requireAdmin = async (ctx, next) => {
  if (!ctx.user || ctx.user.role !== 'admin') {
    ctx.status = 403;
    ctx.body = { message: 'Admin access required' };
    return;
  }
  await next();
}; 