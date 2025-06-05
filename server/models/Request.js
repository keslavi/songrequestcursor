import mongoose from 'mongoose';
import dayjs from 'dayjs';

const requestSchema = new mongoose.Schema({
  show: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  songId: {
    type: String, // References the song in performer's embedded songs array
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'in-progress', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  scheduledTime: Date, // When the song is planned to be performed
  completedAt: Date,  // When the song was actually performed
  payment: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded'],
      default: 'pending'
    },
    venmoTransactionId: String,
    refundTransactionId: String
  },
  specialRequests: {
    message: String,
    dedicatedTo: String
  },
  performanceRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    ratedAt: Date
  },
  notifications: [{
    type: {
      type: String,
      enum: ['status_update', 'coming_up', 'completed', 'payment_update']
    },
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true
});

// Indexes for common queries
requestSchema.index({ show: 1, status: 1 });
requestSchema.index({ requester: 1, show: 1 });
requestSchema.index({ show: 1, scheduledTime: 1 });
requestSchema.index({ 'payment.status': 1 });

// Virtual for time until scheduled performance
requestSchema.virtual('timeUntilPerformance').get(function() {
  if (!this.scheduledTime) return null;
  return dayjs(this.scheduledTime).diff(dayjs());
});

// Method to check if request can be cancelled
requestSchema.methods.canBeCancelled = function() {
  return ['pending', 'approved'].includes(this.status) &&
         this.payment.status !== 'refunded';
};

// Method to process refund
requestSchema.methods.processRefund = async function() {
  if (!this.canBeCancelled()) {
    throw new Error('Request cannot be refunded');
  }

  // TODO: Implement Venmo refund logic here
  this.payment.status = 'refunded';
  this.status = 'cancelled';
  await this.save();
};

// Method to update status with notification
requestSchema.methods.updateStatus = async function(newStatus, message) {
  this.status = newStatus;
  
  if (['completed', 'rejected', 'cancelled'].includes(newStatus)) {
    this.completedAt = new Date();
  }

  // Add notification
  this.notifications.push({
    type: 'status_update',
    message: message || `Request status updated to ${newStatus}`
  });

  await this.save();
};

// Static method to get current queue for a show
requestSchema.statics.getShowQueue = function(showId, status = ['pending', 'approved', 'in-progress']) {
  return this.find({
    show: showId,
    status: { $in: status }
  })
  .sort({ scheduledTime: 1, requestedAt: 1 })
  .populate('requester', 'profile.name');
};

// Static method to check if user can make more requests
requestSchema.statics.canUserRequest = async function(showId, userId) {
  const show = await mongoose.model('Show').findById(showId);
  if (!show) return false;

  const activeRequestCount = await this.countDocuments({
    show: showId,
    requester: userId,
    status: { $in: ['pending', 'approved', 'in-progress'] }
  });

  return activeRequestCount < show.settings.maxRequestsPerUser;
};

const Request = mongoose.model('Request', requestSchema);

export default Request; 