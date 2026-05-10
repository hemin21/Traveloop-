import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  tripId: mongoose.Types.ObjectId;
  stopId?: mongoose.Types.ObjectId;
  userId: string;
  title: string;
  content: string;
  day?: number;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  stopId: { type: Schema.Types.ObjectId, ref: 'Stop' },
  stop: { type: String },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  day: { type: Number },
}, { timestamps: true });

// Indexes for fast lookups
NoteSchema.index({ tripId: 1, userId: 1 }); // notes per trip per user
NoteSchema.index({ stopId: 1 });             // notes per stop

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
