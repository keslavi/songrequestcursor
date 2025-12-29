import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

/**
 * Load environment variables from the server .env.local file when present.
 * This script copies performer users and their songs from a source database
 * into a target database while preserving the original ObjectId values.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localEnvPath = path.join(__dirname, '..', '.env.local');
dotenv.config({ path: localEnvPath, override: false });
dotenv.config();

const {
  SOURCE_MONGODB_URI,
  SOURCE_DB_NAME,
  TARGET_MONGODB_URI,
  TARGET_DB_NAME,
  LOCAL_MONGODB_URI,
  LOCAL_DB_NAME,
  MONGODB_URI,
  MONGODB_DB_NAME
} = process.env;

const resolvedSourceUri = SOURCE_MONGODB_URI || LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/songrequest';
const resolvedTargetUri = TARGET_MONGODB_URI || MONGODB_URI;

if (!resolvedTargetUri) {
  console.error('Missing target MongoDB URI. Set TARGET_MONGODB_URI or MONGODB_URI.');
  process.exit(1);
}

const resolvedSourceDbName = SOURCE_DB_NAME || LOCAL_DB_NAME || 'songrequest';
const resolvedTargetDbName = TARGET_DB_NAME || MONGODB_DB_NAME || 'songrequest';

let sourceConnection;
let targetConnection;

const collections = {
  users: 'users',
  songs: 'songs'
};

async function createConnection(uri, dbName, label) {
  const connection = await mongoose.createConnection(uri, { dbName }).asPromise();
  connection.on('error', (error) => {
    console.error(`❌ Mongoose connection error on ${label}:`, error);
  });
  return connection;
}

async function runMigration() {
  console.log('⏳ Starting performer/user + song migration');
  console.log(`• Source: ${resolvedSourceUri}/${resolvedSourceDbName}`);
  console.log(`• Target: ${resolvedTargetUri}/${resolvedTargetDbName}`);

  try {
    sourceConnection = await createConnection(resolvedSourceUri, resolvedSourceDbName, 'source');
    targetConnection = await createConnection(resolvedTargetUri, resolvedTargetDbName, 'target');

    const performers = await sourceConnection
      .collection(collections.users)
      .find({ role: 'performer' })
      .toArray();

    if (performers.length === 0) {
      console.warn('⚠️  No performer users found in source database. Nothing to migrate.');
      return;
    }

    const performerIds = performers.map((performer) => performer._id);

    // Upsert performers into target database
    const performerWrites = performers.map((performer) => ({
      replaceOne: {
        filter: { _id: performer._id },
        replacement: performer,
        upsert: true
      }
    }));

    const performerResult = await targetConnection
      .collection(collections.users)
      .bulkWrite(performerWrites, { ordered: false });

    console.log(`✅ Migrated performers: matched ${performerResult.matchedCount}, upserted ${performerResult.upsertedCount}`);

    // Fetch songs tied to the migrated performers
    const songs = await sourceConnection
      .collection(collections.songs)
      .find({ performer: { $in: performerIds } })
      .toArray();

    if (songs.length === 0) {
      console.log('ℹ️  No songs associated with the migrated performers.');
      return;
    }

    const songWrites = songs.map((song) => ({
      replaceOne: {
        filter: { _id: song._id },
        replacement: song,
        upsert: true
      }
    }));

    const songResult = await targetConnection
      .collection(collections.songs)
      .bulkWrite(songWrites, { ordered: false });

    console.log(`✅ Migrated songs: matched ${songResult.matchedCount}, upserted ${songResult.upsertedCount}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await Promise.allSettled([
      sourceConnection?.close(),
      targetConnection?.close()
    ]);
    console.log('🏁 Migration complete. Connections closed.');
  }
}

runMigration();
