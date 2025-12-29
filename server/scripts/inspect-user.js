import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath, override: false });
dotenv.config();

const userIdArg = process.argv[2];

if (!userIdArg || !mongoose.Types.ObjectId.isValid(userIdArg)) {
  console.error('Usage: node scripts/inspect-user.js <ObjectId>');
  process.exit(1);
}

const { TARGET_MONGODB_URI, TARGET_DB_NAME, MONGODB_URI, MONGODB_DB_NAME } = process.env;
const uri = TARGET_MONGODB_URI || MONGODB_URI;

if (!uri) {
  console.error('Missing MongoDB URI. Set TARGET_MONGODB_URI or MONGODB_URI.');
  process.exit(1);
}

const dbName = TARGET_DB_NAME || MONGODB_DB_NAME;

try {
  await mongoose.connect(uri, dbName ? { dbName } : undefined);
  const user = await User.findById(userIdArg).lean();
  if (!user) {
    console.log('User not found.');
  } else {
    console.log(JSON.stringify(user, null, 2));
  }
} catch (error) {
  console.error('Failed to inspect user:', error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
