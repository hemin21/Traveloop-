import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import GlobalActivity from '@/lib/models/GlobalActivity';

const INITIAL_GLOBAL_ACTIVITIES = [
  { name: "Eiffel Tower Summit", city: "Paris", country: "France", type: "Sightseeing", estimatedCost: 35, duration: 2, description: "Take the elevator to the top of the iconic Eiffel Tower.", rating: 4.8 },
  { name: "Louvre Museum Guided Tour", city: "Paris", country: "France", type: "Sightseeing", estimatedCost: 55, duration: 3, description: "Skip the line and explore the world's largest museum.", rating: 4.7 },
  { name: "Sushi Making Class", city: "Tokyo", country: "Japan", type: "Food", estimatedCost: 80, duration: 3, description: "Learn to make authentic sushi with a local master.", rating: 4.9 },
  { name: "Shibuya Crossing Walk", city: "Tokyo", country: "Japan", type: "Landmark", estimatedCost: 0, duration: 0.5, description: "Experience the busiest pedestrian crossing in the world.", rating: 4.6 },
  { name: "Mount Batur Sunrise Trek", city: "Bali", country: "Indonesia", type: "Adventure", estimatedCost: 45, duration: 6, description: "Hike up an active volcano to watch the sunrise.", rating: 4.7 },
  { name: "Colosseum Underground Tour", city: "Rome", country: "Italy", type: "Sightseeing", estimatedCost: 60, duration: 3, description: "Explore the restricted underground areas of the Colosseum.", rating: 4.8 },
  { name: "Trattoria Dinner in Trastevere", city: "Rome", country: "Italy", type: "Food", estimatedCost: 40, duration: 2, description: "Authentic Italian cuisine in a lively historic district.", rating: 4.5 },
  { name: "High-Speed Rail to Kyoto", city: "Tokyo", country: "Japan", type: "Transport", estimatedCost: 120, duration: 2.5, description: "Bullet train ride from Tokyo to Kyoto.", rating: 4.5 },
  { name: "Top of the Rock Observatory", city: "New York", country: "USA", type: "Sightseeing", estimatedCost: 42, duration: 1.5, description: "Panoramic 360-degree views of the NYC skyline.", rating: 4.7 },
  { name: "Table Mountain Cableway", city: "Cape Town", country: "South Africa", type: "Adventure", estimatedCost: 22, duration: 2, description: "Soar up the mountain in the rotating cable car.", rating: 4.9 }
];

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const query = searchParams.get('q');

    const dbQuery: any = {};

    // City filter — backed by the city index
    if (city && city.toLowerCase() !== 'all') {
      dbQuery.city = { $regex: city, $options: 'i' };
    }

    // Use $text search (uses text index) instead of $regex for full-text search
    if (query) {
      dbQuery.$text = { $search: query };
    }

    let activities = await GlobalActivity.find(dbQuery).lean();

    // Seed dataset if initial collection is empty (no filters active)
    if (activities.length === 0 && !city && !query) {
      await GlobalActivity.insertMany(INITIAL_GLOBAL_ACTIVITIES);
      activities = await GlobalActivity.find({}).lean();
    }

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('Failed to fetch global activities:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
