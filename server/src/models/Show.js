import mongoose from 'mongoose';

const showSchema = new mongoose.Schema({
  performer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['performer', 'manager'],
      required: true
    }
  }],
  venue: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    mapUrl: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  dateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 180
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  availableSongs: [{
    type: String,
    required: true
  }],
  settings: {
    maxRequestsPerUser: {
      type: Number,
      default: 3
    },
    requestTimeWindow: {
      type: Number,
      default: 30
    },
    autoApproveRequests: {
      type: Boolean,
      default: true
    },
    requireTip: {
      type: Boolean,
      default: false
    },
    suggestedTipAmount: {
      type: Number,
      default: 5
    },
    allowExplicitSongs: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalRequests: {
      type: Number,
      default: 0
    },
    completedRequests: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    averageTip: {
      type: Number,
      default: 0
    },
    peakConcurrentRequests: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Create geospatial index for venue location
showSchema.index({ 'venue.location': '2dsphere' });

// Method to check if a user has access to the show
showSchema.methods.hasAccess = function(userId, userRole) {
  // Admins always have access
  if (userRole === 'admin') return true;

  // Convert userId to string for comparison
  userId = userId.toString();

  // Check if user is the main performer, a manager, or an additional performer
  return (
    this.performer.toString() === userId ||
    this.participants.some(p => p.user.toString() === userId && p.role === 'manager')
  );
};

// Method to check if a song is available for request
showSchema.methods.isSongAvailable = async function(songId) {
  const performer = await this.populate('performer');
  const song = performer.songs.id(songId);

  if (!song) {
    return false;
  }

  return (
    this.availableSongs.includes(songId) &&
    song.isAvailableForShow(this.dateTime)
  );
};

// Method to get all available songs with details
showSchema.methods.getAvailableSongsWithDetails = async function() {
  const performer = await this.populate('performer');
  return this.availableSongs
    .map(songId => performer.songs.id(songId))
    .filter(song => song && song.performerDetails.isActive);
};

// Method to update show statistics
showSchema.methods.updateStats = async function(requestData) {
  const { tip, status } = requestData;

  this.stats.totalRequests++;
  
  if (status === 'completed') {
    this.stats.completedRequests++;
    
    if (tip) {
      this.stats.totalEarnings += tip;
      this.stats.averageTip = this.stats.totalEarnings / this.stats.completedRequests;
    }
  }

  await this.save();
};

export default mongoose.model('Show', showSchema); 