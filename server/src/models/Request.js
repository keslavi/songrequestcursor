import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  show: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  requesterPhone: {
    type: String,
    trim: true,
    default: null
  },
  requesterName: {
    type: String,
    trim: true,
    default: ''
  },
  songs: [{
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song'
    },
    songname: {
      type: String,
      required: true,
      trim: true
    },
    artist: {
      type: String,
      trim: true
    },
    key: {
      type: String,
      trim: true
    },
    isCustom: {
      type: Boolean,
      default: false
    }
  }],
  dedication: {
    type: String,
    trim: true
  },
  tipAmount: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 5
  },
  status: {
    type: String,
    enum: ['pending', 'playing', 'add_to_request', 'played', 'alternate', 'declined'],
    default: 'pending'
  },
  priority: {
    type: Number,
    default: 0
  },
  tip: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded'],
      default: 'pending'
    }
  },
  performerResponses: [{
    performer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    response: {
      type: String,
      enum: ['accept', 'pass'],
      required: true
    },
    respondedAt: {
      type: Date,
      default: Date.now
    }
  }],
  performerNotes: String,
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient querying
requestSchema.index({ show: 1, user: 1 });
requestSchema.index({ show: 1, requesterPhone: 1 });
requestSchema.index({ status: 1, createdAt: -1 });

// Method to check if request can be modified
requestSchema.methods.canBeModified = function() {
  return ['pending', 'alternate', 'add_to_request'].includes(this.status);
};

// Method to get songs display text
requestSchema.methods.getSongsDisplayText = function() {
  return this.songs.map(song => {
    if (song.artist) {
      const artistInitials = song.artist
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('');
      return `${song.songname} (${artistInitials})`;
    }
    return song.songname;
  }).join(', ');
};

// Method to get venmo note text
requestSchema.methods.getVenmoNote = function() {
  const songsText = this.getSongsDisplayText();
  const dedicationText = this.dedication ? `, DEDICATION-${this.dedication}` : '';
  return `7169:confirm…$${songsText}${dedicationText}`;
};

// Method to get venmo URL
requestSchema.methods.getVenmoUrl = function() {
  const note = encodeURIComponent(this.getVenmoNote());
  return `https://venmo.com/GoEvenSteven?txn=pay&amount=${this.tipAmount}&note=${note}`;
};

// Method to get performer response for a specific performer
requestSchema.methods.getPerformerResponse = function(performerId) {
  const response = this.performerResponses.find(
    r => r.performer.toString() === performerId.toString()
  );
  return response ? response.response : null;
};

// Method to get public request data
requestSchema.methods.toPublic = function() {
  const phoneDigits = this.requesterPhone ? String(this.requesterPhone).replace(/[^\d]/g, '') : '';
  const last4 = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : null;

  return {
    id: this._id,
    show: this.show,
    user: this.user,
    requesterPhoneLast4: last4,
    songs: this.songs,
    dedication: this.dedication,
    tipAmount: this.tipAmount,
    status: this.status,
    priority: this.priority,
    tip: {
      status: this.tip.status
    },
    performerResponses: this.performerResponses,
    performerNotes: this.performerNotes,
    completedAt: this.completedAt,
    songsDisplayText: this.getSongsDisplayText(),
    venmoUrl: this.getVenmoUrl(),
  requesterName: this.requesterName || '',
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export const Request = mongoose.model('Request', requestSchema); 