import mongoose, { Schema, Document } from 'mongoose';

export interface IStop extends Document {
  tripId: mongoose.Types.ObjectId;
  cityName: string;
  country: string;
  startDate: Date;
  endDate: Date;
  order: number;
  budget?: number;
  notes?: string;
  createdAt: Date;
}

const StopSchema: Schema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  cityName: { type: String, required: true },
  country: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  order: { type: Number, required: true },
  budget: { type: Number },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Stop || mongoose.model<IStop>('Stop', StopSchema);
