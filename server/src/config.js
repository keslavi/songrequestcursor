import dotenv from 'dotenv';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

const config = {
  // Server settings
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB settings
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/songrequest',
    options: {
      // Modern MongoDB driver options
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000
    }
  },

  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Email settings
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    defaultFrom: process.env.EMAIL_FROM
  },

  // Client URL for CORS
  // Default to the Vite dev port used by this repo.
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // SMS / Phone verification settings
  sms: {
    provider: process.env.SMS_PROVIDER || 'console', // 'console' | 'twilio'
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_FROM
    },
    verification: {
      codeTtlMinutes: parseInt(process.env.PHONE_CODE_TTL_MINUTES || '10', 10),
      resendCooldownSeconds: parseInt(process.env.PHONE_RESEND_COOLDOWN_SECONDS || '30', 10),
      maxAttempts: parseInt(process.env.PHONE_MAX_ATTEMPTS || '5', 10),
      messagePrefix: process.env.PHONE_SMS_PREFIX || 'Your verification code is'
    }
  },

  // Google Maps API configuration
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY
  },

  // Spotify API configuration (for song autocomplete)
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
  }
};

export default config;
