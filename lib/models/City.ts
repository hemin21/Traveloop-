import mongoose from "mongoose";

export interface ICity extends mongoose.Document {
  name: string;
  country: string;
  region: string;
  costIndex: string;
  popularity: number;
  description: string;
  highlights: string[];
}

const CitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    country: { type: String, required: true },
    region: { type: String, required: true },
    costIndex: { type: String },
    popularity: { type: Number },
    description: { type: String },
    highlights: [{ type: String }],
  },
  { timestamps: true }
);

// Indexes for fast search
CitySchema.index({ name: 1 });           // city lookup by name
CitySchema.index({ country: 1 });        // filter by country
CitySchema.index({ name: 'text', description: 'text' }); // text search

export default mongoose.models.City || mongoose.model<ICity>("City", CitySchema);
