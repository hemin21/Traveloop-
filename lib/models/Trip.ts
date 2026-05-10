import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  userId: string;
  title: string;
  description?: string;
  coverPhoto?: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'ongoing' | 'completed';
  isPublic: boolean;
  shareToken?: string;
  totalBudget?: number;
  totalSpent: number;
  currency: string;
  collaborators: string[];
  stops: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema: Schema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  coverPhoto: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  isPublic: { type: Boolean, default: false },
  shareToken: { type: String },
  totalBudget: { type: Number },
  totalSpent: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  collaborators: { type: [String], default: [] },
  stops: [{ type: Schema.Types.ObjectId, ref: 'Stop' }],
}, { timestamps: true });

// Indexes for fast lookups
TripSchema.index({ userId: 1, createdAt: -1 }); // list trips by user, newest first
TripSchema.index({ isPublic: 1, createdAt: -1 }); // community / public trips

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);
