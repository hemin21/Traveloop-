import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import City from '@/lib/models/City';

// Utility initial dataset to seed the system if it starts empty
const INITIAL_CITIES = [
  { name: "Paris", country: "France", region: "Europe", costIndex: "High", popularity: 98, highlights: ["Eiffel Tower", "Louvre", "Fine Dining"] },
  { name: "Tokyo", country: "Japan", region: "Asia", costIndex: "High", popularity: 99, highlights: ["Shibuya", "Sushi", "Temples"] },
  { name: "Bali", country: "Indonesia", region: "Asia", costIndex: "Low", popularity: 92, highlights: ["Beaches", "Surfing", "Temples"] },
  { name: "Rome", country: "Italy", region: "Europe", costIndex: "Medium", popularity: 95, highlights: ["Colosseum", "Pasta", "Vatican"] },
  { name: "New York", country: "USA", region: "Americas", costIndex: "High", popularity: 97, highlights: ["Times Square", "Broadway", "Central Park"] },
  { name: "Dubai", country: "UAE", region: "Middle East", costIndex: "High", popularity: 94, highlights: ["Burj Khalifa", "Shopping", "Desert"] },
  { name: "Cape Town", country: "South Africa", region: "Africa", costIndex: "Medium", popularity: 86, highlights: ["Table Mountain", "Penguins", "Wine"] },
  { name: "London", country: "UK", region: "Europe", costIndex: "High", popularity: 96, highlights: ["Big Ben", "British Museum", "Pubs"] },
  { name: "Amsterdam", country: "Netherlands", region: "Europe", costIndex: "Medium", popularity: 89, highlights: ["Canals", "Rijksmuseum", "Biking"] },
  { name: "Cairo", country: "Egypt", region: "Africa", costIndex: "Low", popularity: 82, highlights: ["Pyramids", "Sphinx", "Nile River"] }
];

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase();

    let dbQuery = {};
    if (query) {
      dbQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { country: { $regex: query, $options: 'i' } },
          { region: { $regex: query, $options: 'i' } }
        ]
      };
    }

    let cities = await City.find(dbQuery).lean();

    // Seed dataset if empty to present good data immediately
    if (cities.length === 0 && !query) {
      await City.insertMany(INITIAL_CITIES);
      cities = await City.find(dbQuery).lean();
    }

    return NextResponse.json(cities);
  } catch (error: any) {
    console.error('Failed to fetch cities:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
