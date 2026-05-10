import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string; // Optional in schema, required for traditional registration
  firstName?: string;
  lastName?: string;
  photo?: string;
  phone?: string;
  city?: string;
  country?: string;
  additionalInfo?: string;
  preferredCurrency?: string;
  savedDestinations: string[];
  isAdmin: boolean;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  photo: { type: String },
  phone: { type: String },
  city: { type: String },
  country: { type: String },
  additionalInfo: { type: String },
  preferredCurrency: { type: String, default: 'USD' },
  savedDestinations: { type: [String], default: [] },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
