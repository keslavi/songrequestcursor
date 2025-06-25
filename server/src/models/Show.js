import mongoose from 'mongoose';

const showSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dateFrom: {
    type: Date,
    required: true
  },
  dateTo: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled'],
    default: 'draft'
  },
  venue: {
    name: {
      type: String,
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
      street: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      },
      state: {
        type: String,
        trim: true
      },
      zip: {
        type: String,
        trim: true
      }
    },
    location: {
      coordinates: {
        type: [Number],
        index: '2dsphere'
      },
      mapsLink: {
        type: String,
        trim: true
      }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  additionalPerformers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  requests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  }],
  settings: {
    allowRequests: {
      type: Boolean,
      default: true
    },
    maxRequestsPerUser: {
      type: Number,
      default: 3
    },
    requestDeadline: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
showSchema.index({ dateFrom: 1, status: 1 });
showSchema.index({ dateTo: 1, status: 1 });
showSchema.index({ createdBy: 1 });
showSchema.index({ 'venue.location.coordinates': '2dsphere' });

// Method to check if show is accepting requests
showSchema.methods.isAcceptingRequests = function() {
  if (!this.settings.allowRequests) return false;
  if (this.status !== 'published') return false;
  if (this.settings.requestDeadline && new Date() > this.settings.requestDeadline) return false;
  return true;
};

// Method to check if user has access to this show
showSchema.methods.hasAccess = function(userId, userRole) {
  // Admins have access to all shows
  if (userRole === 'admin') return true;
  
  // Creator has access
  if (this.createdBy && this.createdBy.toString() === userId.toString()) return true;
  
  // Main performer has access
  if (this.performer && this.performer.toString() === userId.toString()) return true;
  
  // Additional performers have access
  if (this.additionalPerformers && this.additionalPerformers.some(p => p.toString() === userId.toString())) return true;
  
  return false;
};

// Method to get public show data
showSchema.methods.toPublic = function() {
  return {
    id: this._id,
    name: this.name,
    dateFrom: this.dateFrom,
    dateTo: this.dateTo,
    location: this.location,
    description: this.description,
    status: this.status,
    venue: this.venue,
    performer: this.performer,
    additionalPerformers: this.additionalPerformers,
    settings: {
      allowRequests: this.settings.allowRequests,
      maxRequestsPerUser: this.settings.maxRequestsPerUser,
      requestDeadline: this.settings.requestDeadline
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export const Show = mongoose.model('Show', showSchema); 