import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  stopId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: 'sightseeing' | 'food' | 'adventure' | 'transport' | 'hotel' | 'other';
  cost?: number;
  duration?: number;
  startTime?: string;
  date: Date;
  image?: string;
  isCustom: boolean;
}

const ActivitySchema: Schema = new Schema({
  stopId: { type: Schema.Types.ObjectId, ref: 'Stop', required: true },
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['sightseeing', 'food', 'adventure', 'transport', 'hotel', 'other'], required: true },
  cost: { type: Number },
  duration: { type: Number },
  startTime: { type: String },
  date: { type: Date, required: true },
  image: { type: String },
  isCustom: { type: Boolean, default: true },
});

export default mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
