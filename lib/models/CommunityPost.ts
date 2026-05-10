import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityPost extends Document {
  userId: string;
  tripId: mongoose.Types.ObjectId;
  userName: string;
  userPhoto?: string;
  content: string;
  image?: string;
  tags: string[];
  likes: string[];
  createdAt: Date;
}

const CommunityPostSchema: Schema = new Schema({
  userId: { type: String, required: true },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  userName: { type: String, required: true },
  userPhoto: { type: String },
  content: { type: String, required: true },
  image: { type: String },
  tags: { type: [String], default: [] },
  likes: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.CommunityPost || mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
