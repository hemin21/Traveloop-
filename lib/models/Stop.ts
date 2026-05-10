import mongoose, { Schema, Document } from 'mongoose';

export interface IStop extends Document {
  tripId: mongoose.Types.ObjectId;
  city: string;
  country?: string;
  startDate?: Date;
  endDate?: Date;
  order: number;
  budget?: number;
  notes?: string;
  createdAt: Date;
}

const StopSchema: Schema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  city: { type: String, required: true },
  country: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  order: { type: Number, required: true },
  budget: { type: Number },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for fast lookups
StopSchema.index({ tripId: 1, order: 1 }); // fetch + sort stops for a trip

export default mongoose.models.Stop || mongoose.model<IStop>('Stop', StopSchema);
