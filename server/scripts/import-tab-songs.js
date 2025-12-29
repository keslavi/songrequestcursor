import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Song } from '../src/models/Song.js';
import { User } from '../src/models/User.js';

/**
 * Import a tab-separated song list for a single performer.
 * Usage: node scripts/import-tab-songs.js <performerId> [path/to/file.tab]
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultEnvPath = path.join(__dirname, '..', '.env.local');
dotenv.config({ path: defaultEnvPath, override: false });
dotenv.config();

const performerIdArg = process.argv[2];
const filePathArg = process.argv[3];

const performerIdValue = performerIdArg || process.env.SONG_IMPORT_PERFORMER_ID;

if (!performerIdValue) {
  console.error('❌ Missing performer ObjectId. Pass it as the first argument or set SONG_IMPORT_PERFORMER_ID.');
  process.exit(1);
}

if (!mongoose.Types.ObjectId.isValid(performerIdValue)) {
  console.error('❌ Invalid performer ObjectId provided:', performerIdValue);
  process.exit(1);
}

const performerId = new mongoose.Types.ObjectId(performerIdValue);

const resolvedFilePath = filePathArg
  || process.env.SONG_IMPORT_FILE
  || path.resolve(__dirname, '../../doc/Songlist-final.tab');

const targetUri = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI;
const targetDbName = process.env.TARGET_DB_NAME || process.env.MONGODB_DB_NAME; // Optional when URI already specifies db

if (!targetUri) {
  console.error('❌ Missing target MongoDB URI. Configure TARGET_MONGODB_URI or MONGODB_URI.');
  process.exit(1);
}

function parseNumber(value) {
  if (!value) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function cleanString(value) {
  return value ? value.trim() : '';
}

function normaliseTags(...candidates) {
  const tags = new Set();
  candidates
    .flatMap((candidate) => {
      const value = cleanString(candidate);
      if (!value) return [];
      return value.split('/').map((tag) => tag.trim()).filter(Boolean);
    })
    .forEach((tag) => tags.add(tag));
  return Array.from(tags);
}

function parseTsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const header = lines.shift().split('\t').map((cell) => cell.trim());

  return lines.map((line) => {
    const cells = line.split('\t');
    const entry = {};
    header.forEach((column, index) => {
      entry[column] = cleanString(cells[index] ?? '');
    });
    return entry;
  });
}

function mapToSongDocument(raw) {
  const songname = cleanString(raw['Song Title']);
  const artist = cleanString(raw['Artist']);

  if (!songname || !artist) {
    return null;
  }

  const key = cleanString(raw['Key']);
  const bpm = parseNumber(cleanString(raw['BPM']));
  const genre = cleanString(raw['Genre']);
  const decade = cleanString(raw['Decade']);
  const ultimateLink = cleanString(raw['Ultimate Guitar Link']);
  const lyricsLink = cleanString(raw['Lyrics Link']);

  return {
    performer: performerId,
    songname,
    artist,
    key: key || undefined,
    bpm,
    tags: normaliseTags(genre, decade),
    link1: ultimateLink || undefined,
    link2: lyricsLink || undefined
  };
}

async function run() {
  console.log('⏳ Importing songs from:', resolvedFilePath);
  console.log('🎤 Target performer:', performerIdValue);

  const fileBuffer = await fs.readFile(resolvedFilePath, 'utf8');
  const rows = parseTsv(fileBuffer);

  if (rows.length === 0) {
    console.warn('⚠️  No rows found in the provided TSV file.');
    return;
  }

  const mapped = rows
    .map(mapToSongDocument)
    .filter((doc) => doc !== null);

  if (mapped.length === 0) {
    console.warn('⚠️  No valid song entries after parsing.');
    return;
  }

  await mongoose.connect(targetUri, targetDbName ? { dbName: targetDbName } : undefined);

  try {
    const performer = await User.findById(performerId).lean();
    if (!performer) {
      console.error('❌ Performer not found in target database:', performerIdValue);
      process.exit(1);
    }

    console.log(`👤 Performer confirmed: ${performer.username || performer.profile?.stageName || performer._id}`);

    const now = new Date();

    const operations = mapped.map((song) => ({
      updateOne: {
        filter: {
          performer: performerId,
          songname: song.songname,
          artist: song.artist
        },
        update: {
          $set: {
            ...song,
            updatedAt: now
          },
          $setOnInsert: {
            createdAt: now
          }
        },
        upsert: true
      }
    }));

    const result = await Song.bulkWrite(operations, { ordered: false });

    console.log('✅ Import completed.');
    console.log(`• Upserted: ${result.upsertedCount}`);
    console.log(`• Matched existing: ${result.matchedCount}`);
    console.log(`• Modified existing: ${result.modifiedCount}`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error('❌ Song import failed:', error);
  process.exitCode = 1;
});
