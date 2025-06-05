import mongoose from 'mongoose';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);

const showSchema = new mongoose.Schema({
  performer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  venue: {
    name: {
      type: String,
      required: true,
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
      },
      mapsLink: {
        type: String,
        trim: true
      }
    }
  },
  dateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 180 // 3 hours default
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  // Available songs for this show (subset of performer's songs by ID)
  availableSongs: [{
    type: String, // Store MongoDB ObjectId as string since we're referencing subdocuments
    required: true
  }],
  // Show settings
  settings: {
    maxRequestsPerUser: {
      type: Number,
      default: 3
    },
    allowExplicitSongs: {
      type: Boolean,
      default: true
    }
  },
  // Stats
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

// Create index for querying upcoming shows
showSchema.index({ dateTime: 1, status: 1 });

// Virtual for formatted date/time
showSchema.virtual('dateTimeFormatted').get(function() {
  return dayjs(this.dateTime).format('LLLL');
});

// Virtual for show duration in hours and minutes
showSchema.virtual('durationFormatted').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  return `${hours}h ${minutes}m`;
});

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
      // Update average tip
      this.stats.averageTip = this.stats.totalEarnings / this.stats.completedRequests;
    }
  }

  await this.save();
};

// Static method to find nearby shows
showSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    'venue.location': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance // in meters
      }
    },
    dateTime: { $gte: new Date() },
    status: 'scheduled'
  }).populate('performer', 'profile.name profile.avatar');
};

const Show = mongoose.model('Show', showSchema);

export default Show; 