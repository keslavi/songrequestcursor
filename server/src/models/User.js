import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  email: {
    type: String,
    required: function() {
      // Email is required for traditional (non-phone, non-social) users
      return !this.phoneNumber && !this.profile?.auth0Id;
    },
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      // Password is only required for traditional (non-phone, non-social) users
      return !this.phoneNumber && !this.profile?.auth0Id;
    },
    minlength: 8
  },
  role: {
    type: String,
    enum: ['guest', 'user', 'admin','performer','organizer'],
    default: 'guest'
  },
  profile: {
    firstName: String,
    lastName: String,
    name: String,
    stageName: String,
    bio: String,
    avatar: String,
    picture: String, // For social auth profile pictures
    description: String,
    headshotUrl: String,
    venmoHandle: String,
    venmoConfirmDigits: String,
    contactEmail: String,
    contactPhone: String,
    auth0Id: String, // Auth0 user ID (e.g., "google-oauth2|123456789")
    lastSocialLogin: Date, // Track when user last logged in via social auth
    socialProvider: String, // Track which social provider (google, facebook, etc.)
    phoneNumber: String, // Phone number from social auth
    emailVerified: Boolean, // Email verification status
    phoneNumberVerified: Boolean, // Phone verification status
    givenName: String, // First name from social auth
    familyName: String, // Last name from social auth
    nickname: String, // Nickname from social auth
    locale: String // User's locale/language preference
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Hash password before saving (only for non-social auth users)
userSchema.pre('save', async function(next) {
  // Skip password hashing for social auth users
  if (this.profile?.auth0Id) {
    return next();
  }
  
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method (only for non-social auth users)
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Social auth users don't have passwords to compare
  if (this.profile?.auth0Id) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user is social auth user
userSchema.methods.isSocialUser = function() {
  return !!this.profile?.auth0Id;
};

// Convert user to profile object (excluding sensitive data)
userSchema.methods.toProfile = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email || null,
    phoneNumber: this.phoneNumber || this.profile?.phoneNumber || null,
    role: this.role,
    profile: this.profile,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    isSocialUser: this.isSocialUser(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export const User = mongoose.model('User', userSchema); 