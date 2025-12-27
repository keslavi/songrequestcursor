import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { Song } from './src/models/Song.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Parse decade string to approximate year
function decadeToYear(decade) {
  if (!decade) return null;
  const match = decade.match(/(\d{4})s/);
  if (match) {
    return parseInt(match[1]) + 5; // Use middle of decade
  }
  // Try to match 4-digit year
  const yearMatch = decade.match(/\d{4}/);
  if (yearMatch) {
    return parseInt(yearMatch[0]);
  }
  return null;
}

// Parse the tab-separated file
function parseSonglistFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Skip header line
  const songs = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split('\t');
    if (parts.length < 8) continue;
    
    const [key, songTitle, bpmStr, artist, genre, decade, ultimateGuitarLink, lyricsLink] = parts;
    
    // Skip if essential fields are missing
    if (!songTitle || !artist) continue;
    
    const song = {
      key: key?.trim() || '',
      songname: songTitle?.trim() || '',
      bpm: bpmStr ? parseInt(bpmStr) : null,
      artist: artist?.trim() || '',
      tags: genre ? [genre.trim()] : [],
      year: decadeToYear(decade),
      link1: ultimateGuitarLink?.trim() || '',
      link2: lyricsLink?.trim() || ''
    };
    
    songs.push(song);
  }
  
  return songs;
}

async function importSongs(performerId, songlistFilePath) {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/songrequest';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Parse the songlist file
    console.log(`Parsing ${songlistFilePath}...`);
    const songsData = parseSonglistFile(songlistFilePath);
    console.log(`Found ${songsData.length} songs to import`);
    
    // Validate performer ID
    if (!mongoose.Types.ObjectId.isValid(performerId)) {
      throw new Error(`Invalid performer ID: ${performerId}`);
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const songData of songsData) {
      try {
        // Check if song already exists for this performer
        const existing = await Song.findOne({
          songname: songData.songname,
          artist: songData.artist,
          performer: performerId
        });
        
        if (existing) {
          console.log(`  ⏭️  Skipping duplicate: ${songData.songname} by ${songData.artist}`);
          skipped++;
          continue;
        }
        
        // Create the song
        const song = new Song({
          ...songData,
          performer: performerId
        });
        
        await song.save();
        console.log(`  ✅ Imported: ${songData.songname} by ${songData.artist}`);
        imported++;
        
      } catch (err) {
        console.error(`  ❌ Error importing ${songData.songname}: ${err.message}`);
        errors++;
      }
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`Total songs: ${songsData.length}`);
    console.log(`Imported: ${imported}`);
    console.log(`Skipped (duplicates): ${skipped}`);
    console.log(`Errors: ${errors}`);
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node import-songs.js <performer-id> <songlist-file-path>');
  console.error('Example: node import-songs.js 68543b2c4ca33539476cd120 ../doc/Songlist-final.tab');
  process.exit(1);
}

const [performerId, songlistPath] = args;
const absolutePath = path.resolve(songlistPath);

if (!fs.existsSync(absolutePath)) {
  console.error(`File not found: ${absolutePath}`);
  process.exit(1);
}

console.log(`Starting import for performer: ${performerId}`);
console.log(`From file: ${absolutePath}\n`);

importSongs(performerId, absolutePath);

