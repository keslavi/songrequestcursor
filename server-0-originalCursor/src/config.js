import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config = {
  // Server settings
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB settings
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/songrequest',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET || 'jeskavu',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Email settings
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'dev@evensteven.us',
      pass: process.env.EMAIL_PASSWORD || 'GrapeBird747'
    },
    defaultFrom: process.env.EMAIL_FROM || 'noreply@evenSteven.us'
  },

  // Client URL for CORS
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Google Maps API configuration
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY
  }
};

export default config;
