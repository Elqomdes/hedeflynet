/*
  One-time script to delete ALL assignments and assignment submissions from MongoDB.
  It reads MONGODB_URI and MONGODB_DB from env. If a .env or .env.local file exists,
  it will load simple KEY=VALUE pairs before connecting.
*/

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnvFile(filename) {
  try {
    const fullPath = path.resolve(process.cwd(), filename);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^"|"$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch (e) {
    // ignore
  }
}

// Load env files if present
loadEnvFile('.env.local');
loadEnvFile('.env');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DB || 'hedeflydatas';

  const finalUri = uri.includes('mongodb://') && !uri.includes('/')
    ? `${uri}/${dbName}`
    : uri;

  console.log(`[clear-assignments] Connecting to ${finalUri} (db: ${dbName})...`);
  await mongoose.connect(finalUri, {
    dbName,
    bufferCommands: false,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 30000,
  });

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not available');
  }

  // Collection names derived from Mongoose model names: Assignment, AssignmentSubmission
  const assignmentsCol = db.collection('assignments');
  const submissionsCol = db.collection('assignmentsubmissions');

  console.log('[clear-assignments] Deleting assignment submissions...');
  const subRes = await submissionsCol.deleteMany({});
  console.log(`[clear-assignments] Deleted submissions: ${subRes.deletedCount || 0}`);

  console.log('[clear-assignments] Deleting assignments...');
  const assignRes = await assignmentsCol.deleteMany({});
  console.log(`[clear-assignments] Deleted assignments: ${assignRes.deletedCount || 0}`);

  await mongoose.disconnect();
  console.log('[clear-assignments] Done.');
}

main().catch(async (err) => {
  console.error('[clear-assignments] Error:', err && err.message ? err.message : err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});


