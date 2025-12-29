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

const userId = process.argv[2];
const role = process.argv[3];

if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !role) {
  console.error('Usage: node scripts/update-user-role.js <ObjectId> <role>');
  process.exit(1);
}

const allowedRoles = new Set(['guest', 'user', 'admin', 'performer', 'organizer']);

if (!allowedRoles.has(role)) {
  console.error(`Invalid role "${role}". Allowed values: ${Array.from(allowedRoles).join(', ')}`);
  process.exit(1);
}

const { TARGET_MONGODB_URI, TARGET_DB_NAME, MONGODB_URI, MONGODB_DB_NAME } = process.env;
const uri = TARGET_MONGODB_URI || MONGODB_URI;

if (!uri) {
  console.error('Missing MongoDB URI. Set TARGET_MONGODB_URI or MONGODB_URI.');
  process.exit(1);
}

const dbName = TARGET_DB_NAME || MONGODB_DB_NAME;

async function run() {
  await mongoose.connect(uri, dbName ? { dbName } : undefined);
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found.');
      process.exit(1);
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    console.log(`Updated role for ${user.username || user._id} from ${previousRole} to ${role}.`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error('Failed to update user role:', error);
  process.exitCode = 1;
});
