import mongoose from 'mongoose';

export const PRIVATE_SHOW_JOIN_POINTS = 50;

const normalizePhoneDigits = (value = '') => String(value).replace(/[^\d]/g, '');

const showGuestSchema = new mongoose.Schema({
  show: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  guestName: {
    type: String,
    trim: true,
    default: ''
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

showGuestSchema.index({ show: 1, phoneNumber: 1 }, { unique: true });

showGuestSchema.pre('save', function(next) {
  this.phoneNumber = normalizePhoneDigits(this.phoneNumber);
  next();
});

showGuestSchema.statics.normalizePhone = normalizePhoneDigits;

showGuestSchema.statics.normalizeLegacyGuestName = function(filter = {}) {
  const query = {
    ...filter,
    guestname: { $exists: true },
    guestName: { $exists: false }
  };

  return this.updateMany(query, { $rename: { guestname: 'guestName' } }).catch(() => null);
};

export const ShowGuest = mongoose.model('ShowGuest', showGuestSchema);
