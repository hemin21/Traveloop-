import mongoose, { Schema, Document } from 'mongoose';

export interface IPackingItem extends Document {
  tripId: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  category: 'documents' | 'clothing' | 'electronics' | 'toiletries' | 'other';
  isPacked: boolean;
  createdAt: Date;
}

const PackingItemSchema: Schema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['Documents', 'Clothing', 'Electronics', 'Toiletries', 'Other'], default: 'Other' },
  isPacked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
PackingItemSchema.virtual('id').get(function() { return this._id.toHexString(); });
PackingItemSchema.set('toJSON', { virtuals: true });
PackingItemSchema.set('toObject', { virtuals: true });

export default mongoose.models.PackingItem || mongoose.model<IPackingItem>('PackingItem', PackingItemSchema);
