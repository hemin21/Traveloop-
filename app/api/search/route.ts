import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Trip from '@/lib/models/Trip';
import City from '@/lib/models/City';
import GlobalActivity from '@/lib/models/GlobalActivity';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ trips: [], cities: [], activities: [] });
    }

    await connectToDatabase();

    const searchRegex = new RegExp(q, 'i');

    const [trips, cities, activities] = await Promise.all([
      userId ? Trip.find({
        userId: userId,
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ]
      }).limit(5).select('_id title destination startDate endDate') : Promise.resolve([]),
      
      City.find({
        $or: [
          { name: searchRegex },
          { country: searchRegex },
          { description: searchRegex }
        ]
      }).limit(5).select('_id name country'),
      
      GlobalActivity.find({
        $or: [
          { name: searchRegex },
          { city: searchRegex },
          { description: searchRegex }
        ]
      }).limit(5).select('_id name city type')
    ]);

    return NextResponse.json({ trips, cities, activities });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}
