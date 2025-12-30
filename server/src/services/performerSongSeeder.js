import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Song } from '../models/Song.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SONGS_PATH = path.resolve(__dirname, '..', '..', 'data', 'ff2.tab');

let cachedEntries = null;

const clean = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const parseNumber = (value) => {
  const cleaned = clean(value);
  if (!cleaned) return undefined;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const normaliseTags = (...candidates) => {
  const tags = new Set();
  candidates
    .map(clean)
    .filter(Boolean)
    .forEach((candidate) => {
      candidate
        .split('/')
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((tag) => tags.add(tag));
    });
  return Array.from(tags);
};

const parseDefaultSongs = async () => {
  if (cachedEntries) {
    return cachedEntries;
  }

  let content;
  try {
    content = await fs.readFile(DEFAULT_SONGS_PATH, 'utf8');
  } catch (error) {
    // surface a consistent error upstream; do not cache failures
    const details = error instanceof Error ? error.message : String(error);
    const message = `Unable to read default songs file at ${DEFAULT_SONGS_PATH}: ${details}`;
    throw new Error(message, { cause: error instanceof Error ? error : undefined });
  }

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    cachedEntries = [];
    return cachedEntries;
  }

  const header = lines.shift().split('\t');

  cachedEntries = lines.map((line) => {
    const cells = line.split('\t');
    const entry = {};
    header.forEach((column, index) => {
      entry[column] = clean(cells[index]);
    });
    return entry;
  });

  return cachedEntries;
};

const mapEntryToSong = (entry, performerId) => {
  const songname = clean(entry['Song Title']);
  const artist = clean(entry['Artist']);

  if (!songname || !artist) {
    return null;
  }

  const key = clean(entry['Key']);
  const bpm = parseNumber(entry['BPM']);
  const genre = clean(entry['Genre']);
  const decade = clean(entry['Decade']);
  const ultimateLink = clean(entry['Ultimate Guitar Link']);
  const lyricsLink = clean(entry['Lyrics Link']);

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
};

export const seedDefaultSongsForPerformer = async (performerId) => {
  if (!performerId) {
    return { total: 0, upserted: 0, matched: 0, modified: 0 };
  }

  const entries = await parseDefaultSongs();
  if (entries.length === 0) {
    return { total: 0, upserted: 0, matched: 0, modified: 0 };
  }

  const songs = entries
    .map((entry) => mapEntryToSong(entry, performerId))
    .filter((song) => song !== null);

  if (songs.length === 0) {
    return { total: 0, upserted: 0, matched: 0, modified: 0 };
  }

  const now = new Date();
  const operations = songs.map((song) => ({
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

  return {
    total: songs.length,
    upserted: result.upsertedCount ?? 0,
    matched: result.matchedCount ?? 0,
    modified: result.modifiedCount ?? 0
  };
};

