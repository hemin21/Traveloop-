import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalActivity extends Document {
  name: string;
  city: string;
  country: string;
  type: string;
  estimatedCost?: number;
  duration?: number;
  description?: string;
  bestTimeToVisit?: string;
  rating?: number;
}

const GlobalActivitySchema: Schema = new Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  type: { type: String, required: true },
  estimatedCost: { type: Number },
  duration: { type: Number },
  description: { type: String },
  bestTimeToVisit: { type: String },
  rating: { type: Number },
});

// Indexes for fast search
GlobalActivitySchema.index({ city: 1 });          // filter by city
GlobalActivitySchema.index({ name: 'text', description: 'text' }); // text search

export default mongoose.models.GlobalActivity || mongoose.model<IGlobalActivity>('GlobalActivity', GlobalActivitySchema);
