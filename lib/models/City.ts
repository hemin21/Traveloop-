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

export default mongoose.models.City || mongoose.model<ICity>("City", CitySchema);
