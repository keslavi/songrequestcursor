import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  songname: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  tags: [{
    type: String,
    trim: true
  }],
  key: {
    type: String,
    trim: true
  },
  bpm: {
    type: Number,
    min: 1,
    max: 500
  },
  notes: {
    type: String,
    trim: true
  },
  link1: {
    type: String,
    trim: true
  },
  link2: {
    type: String,
    trim: true
  },
  attachmentUrl: {
    type: String,
    trim: true
  },
  attachmentFilename: {
    type: String,
    trim: true
  },
  performer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
songSchema.index({ songname: 1, artist: 1 });
songSchema.index({ performer: 1 });
songSchema.index({ tags: 1 });

// Method to get searchable text for autocomplete
songSchema.methods.getSearchText = function() {
  return `${this.songname} ${this.artist} ${this.tags.join(' ')}`.toLowerCase();
};

// Method to get display text with artist initials
songSchema.methods.getDisplayText = function() {
  const artistInitials = this.artist
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  return `${this.songname} (${artistInitials})`;
};

// Method to get public song data
songSchema.methods.toPublic = function() {
  return {
    id: this._id,
    songname: this.songname,
    artist: this.artist,
    year: this.year,
    tags: this.tags,
    key: this.key,
    bpm: this.bpm,
    notes: this.notes,
    link1: this.link1,
    link2: this.link2,
    attachmentUrl: this.attachmentUrl,
    attachmentFilename: this.attachmentFilename,
    displayText: this.getDisplayText(),
    searchText: this.getSearchText()
  };
};

export const Song = mongoose.model('Song', songSchema); 