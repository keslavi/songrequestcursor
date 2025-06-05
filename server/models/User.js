import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';

// Embedded song schema
const performerSongSchema = new mongoose.Schema({
  baseInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    artist: {
      type: String,
      required: true,
      trim: true
    },
    genre: String,
    year: {
      type: Number,
      min: 1900,
      max: dayjs().year()
    },
    duration: Number // in seconds
  },
  performerDetails: {
    key: String,
    bpm: Number,
    notes: String,
    tags: [String],
    isActive: {
      type: Boolean,
      default: true
    },
    customizations: {
      alternateArrangement: {
        type: Boolean,
        default: false
      },
      customLyrics: String
    }
  },
  stats: {
    timesRequested: {
      type: Number,
      default: 0
    },
    lastPerformed: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    restrictions: {
      daysOfWeek: [Number], // 0-6 for Sunday-Saturday
      timeSlots: [{
        start: String, // HH:mm format
        end: String    // HH:mm format
      }]
    }
  }
}, {
  timestamps: true
});

// Add method to check song availability
performerSongSchema.methods.isAvailableForShow = function(showDateTime) {
  if (!this.availability.isAvailable || !this.performerDetails.isActive) {
    return false;
  }
  
  const showDate = dayjs(showDateTime);
  const dayOfWeek = showDate.day();
  const timeString = showDate.format('HH:mm');

  // Check day restrictions
  if (this.availability.restrictions?.daysOfWeek?.length &&
      !this.availability.restrictions.daysOfWeek.includes(dayOfWeek)) {
    return false;
  }

  // Check time slot restrictions
  if (this.availability.restrictions?.timeSlots?.length) {
    return this.availability.restrictions.timeSlots.some(slot => 
      timeString >= slot.start && timeString <= slot.end
    );
  }

  return true;
};

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'performer', 'user', 'guest'],
    default: 'user'
  },
  profile: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    venmoUsername: {
      type: String,
      trim: true
    },
    bio: String,
    phone: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    comments: String,
    avatar: String
  },
  // Only for performers: their song catalog
  songs: [performerSongSchema],
  preferences: {
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create text index for song search
userSchema.index({
  'songs.baseInfo.name': 'text',
  'songs.baseInfo.artist': 'text',
  'songs.performerDetails.tags': 'text'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }

  next();
});

// Remove password when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Verify password
userSchema.methods.verifyPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Generate auth token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Find songs by text search
userSchema.methods.findSongs = function(searchText) {
  return this.songs.filter(song => {
    const searchFields = [
      song.baseInfo.name,
      song.baseInfo.artist,
      ...(song.performerDetails.tags || [])
    ].map(field => field.toLowerCase());
    
    const terms = searchText.toLowerCase().split(/\s+/);
    return terms.every(term => 
      searchFields.some(field => field.includes(term))
    );
  });
};

// Get available songs for a show
userSchema.methods.getAvailableSongsForShow = function(showDateTime) {
  return this.songs.filter(song => 
    song.isAvailableForShow(showDateTime)
  );
};

const User = mongoose.model('User', userSchema);

export default User; 