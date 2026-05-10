import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  photo?: string;
  phone?: string;
  city?: string;
  country?: string;
  additionalInfo?: string;
  savedDestinations: string[];
  isAdmin: boolean;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true },
  photo: { type: String },
  phone: { type: String },
  city: { type: String },
  country: { type: String },
  additionalInfo: { type: String },
  savedDestinations: { type: [String], default: [] },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
