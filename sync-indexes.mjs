/**
 * sync-indexes.mjs
 * Run once to push all Mongoose model indexes to MongoDB:
 *   node sync-indexes.mjs
 *
 * Safe to run multiple times — Mongoose skips indexes that already exist.
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read MONGODB_URI from .env.local
const envPath = resolve(__dirname, '.env.local');
const envContents = readFileSync(envPath, 'utf-8');
const match = envContents.match(/MONGODB_URI=(.+)/);
if (!match) {
  console.error('❌  MONGODB_URI not found in .env.local');
  process.exit(1);
}
const MONGODB_URI = match[1].trim();

console.log('🔌  Connecting to MongoDB...');
await mongoose.connect(MONGODB_URI, { bufferCommands: false });
console.log('✅  Connected\n');

const { Schema } = mongoose;

// ── Trip ─────────────────────────────────────────────────────────────────────
const TripSchema = new Schema({ userId: String, isPublic: Boolean }, { timestamps: true });
TripSchema.index({ userId: 1, createdAt: -1 });
TripSchema.index({ isPublic: 1, createdAt: -1 });
const Trip = mongoose.models.Trip || mongoose.model('Trip', TripSchema);

// ── Stop ─────────────────────────────────────────────────────────────────────
const StopSchema = new Schema({ tripId: Schema.Types.ObjectId, order: Number });
StopSchema.index({ tripId: 1, order: 1 });
const Stop = mongoose.models.Stop || mongoose.model('Stop', StopSchema);

// ── Activity ─────────────────────────────────────────────────────────────────
const ActivitySchema = new Schema({ stopId: Schema.Types.ObjectId });
ActivitySchema.index({ stopId: 1 });
const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);

// ── CommunityPost ─────────────────────────────────────────────────────────────
const CommunityPostSchema = new Schema({ userId: String, tripId: Schema.Types.ObjectId, createdAt: Date });
CommunityPostSchema.index({ createdAt: -1 });
CommunityPostSchema.index({ tripId: 1 });
CommunityPostSchema.index({ userId: 1 });
const CommunityPost = mongoose.models.CommunityPost || mongoose.model('CommunityPost', CommunityPostSchema);

// ── PackingItem ───────────────────────────────────────────────────────────────
const PackingItemSchema = new Schema({ tripId: Schema.Types.ObjectId });
PackingItemSchema.index({ tripId: 1 });
const PackingItem = mongoose.models.PackingItem || mongoose.model('PackingItem', PackingItemSchema);

// ── Note ─────────────────────────────────────────────────────────────────────
const NoteSchema = new Schema({ tripId: Schema.Types.ObjectId, stopId: Schema.Types.ObjectId, userId: String }, { timestamps: true });
NoteSchema.index({ tripId: 1, userId: 1 });
NoteSchema.index({ stopId: 1 });
const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

// ── GlobalActivity ────────────────────────────────────────────────────────────
const GlobalActivitySchema = new Schema({ name: String, city: String, description: String });
GlobalActivitySchema.index({ city: 1 });
GlobalActivitySchema.index({ name: 'text', description: 'text' });
const GlobalActivity = mongoose.models.GlobalActivity || mongoose.model('GlobalActivity', GlobalActivitySchema);

// ── Invoice ───────────────────────────────────────────────────────────────────
const InvoiceSchema = new Schema({ tripId: Schema.Types.ObjectId });
InvoiceSchema.index({ tripId: 1 }, { unique: true });
const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);

// ── City ─────────────────────────────────────────────────────────────────────
const CitySchema = new Schema({ name: String, country: String, description: String }, { timestamps: true });
CitySchema.index({ name: 1 });
CitySchema.index({ country: 1 });
CitySchema.index({ name: 'text', description: 'text' });
const City = mongoose.models.City || mongoose.model('City', CitySchema);

// ── User (email unique already in schema) ────────────────────────────────────
const UserSchema = new Schema({ email: { type: String, unique: true } });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// ── Sync all ──────────────────────────────────────────────────────────────────
const models = [Trip, Stop, Activity, CommunityPost, PackingItem, Note, GlobalActivity, Invoice, City, User];

for (const model of models) {
  try {
    await model.syncIndexes();
    console.log(`✅  ${model.modelName.padEnd(20)} indexes synced`);
  } catch (err) {
    console.error(`❌  ${model.modelName.padEnd(20)} FAILED: ${err.message}`);
  }
}

console.log('\n🎉  All indexes synced! Your queries will now use index scans.');
await mongoose.disconnect();
