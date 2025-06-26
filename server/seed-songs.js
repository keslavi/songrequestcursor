import mongoose from 'mongoose';
import { Song } from './src/models/Song.js';
import config from './src/config.js';

// Sample songs data
const sampleSongs = [
  {
    songname: "Wonderwall",
    artist: "Oasis",
    year: 1995,
    tags: ["rock", "britpop", "acoustic", "popular"],
    key: "C",
    notes: "Classic 90s anthem"
  },
  {
    songname: "Hotel California",
    artist: "Eagles",
    year: 1976,
    tags: ["rock", "classic", "guitar", "popular"],
    key: "Bm",
    notes: "Iconic guitar solo"
  },
  {
    songname: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    year: 1987,
    tags: ["rock", "hard rock", "guitar", "popular"],
    key: "D",
    notes: "Famous guitar intro"
  },
  {
    songname: "Stairway to Heaven",
    artist: "Led Zeppelin",
    year: 1971,
    tags: ["rock", "classic", "epic", "guitar"],
    key: "Am",
    notes: "Epic rock ballad"
  },
  {
    songname: "Bohemian Rhapsody",
    artist: "Queen",
    year: 1975,
    tags: ["rock", "opera", "epic", "popular"],
    key: "Bb",
    notes: "Complex multi-section song"
  },
  {
    songname: "Imagine",
    artist: "John Lennon",
    year: 1971,
    tags: ["pop", "peace", "piano", "classic"],
    key: "C",
    notes: "Peace anthem"
  },
  {
    songname: "Hey Jude",
    artist: "The Beatles",
    year: 1968,
    tags: ["pop", "beatles", "piano", "popular"],
    key: "F",
    notes: "Long outro with na na na"
  },
  {
    songname: "Yesterday",
    artist: "The Beatles",
    year: 1965,
    tags: ["pop", "beatles", "acoustic", "melodic"],
    key: "F",
    notes: "Simple acoustic ballad"
  },
  {
    songname: "Let It Be",
    artist: "The Beatles",
    year: 1970,
    tags: ["pop", "beatles", "piano", "inspirational"],
    key: "C",
    notes: "Piano-driven ballad"
  },
  {
    songname: "Don't Stop Believin'",
    artist: "Journey",
    year: 1981,
    tags: ["rock", "arena rock", "uplifting", "popular"],
    key: "E",
    notes: "Arena rock classic"
  }
];

async function seedSongs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('🗄️  Connected to MongoDB');

    // Clear existing songs
    await Song.deleteMany({});
    console.log('🗑️  Cleared existing songs');

    // Add sample songs for a test performer (you'll need to replace this with an actual user ID)
    const testPerformerId = '507f1f77bcf86cd799439011'; // This is a sample ObjectId
    
    const songsWithPerformer = sampleSongs.map(song => ({
      ...song,
      performer: testPerformerId
    }));

    const createdSongs = await Song.insertMany(songsWithPerformer);
    console.log(`✅ Created ${createdSongs.length} sample songs`);

    // Display created songs
    createdSongs.forEach(song => {
      console.log(`- ${song.songname} by ${song.artist} (${song.year})`);
    });

    console.log('\n🎵 Sample songs seeded successfully!');
    console.log(`📝 Note: These songs are associated with performer ID: ${testPerformerId}`);
    console.log('🔧 You may need to update this ID to match an actual user in your database');

  } catch (error) {
    console.error('❌ Error seeding songs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedSongs(); 