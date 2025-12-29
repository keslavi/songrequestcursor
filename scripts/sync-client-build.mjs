#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const clientDist = path.join(projectRoot, 'client', 'dist');
const serverPublic = path.join(projectRoot, 'server', 'public');

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  try {
    const distExists = await fs
      .access(clientDist)
      .then(() => true)
      .catch(() => false);

    if (!distExists) {
      throw new Error(`Client build directory not found at ${clientDist}. Run the client build first.`);
    }

    await fs.rm(serverPublic, { recursive: true, force: true });
    await fs.mkdir(serverPublic, { recursive: true });

    await copyDirectory(clientDist, serverPublic);

    console.log('✅ Synced client/dist into server/public');
  } catch (error) {
    console.error('❌ Failed to sync client build into server/public');
    console.error(error.message || error);
    process.exit(1);
  }
}

await main();
