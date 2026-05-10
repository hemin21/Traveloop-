import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Trip from '@/lib/models/Trip';
import Stop from '@/lib/models/Stop';
import Activity from '@/lib/models/Activity';

export async function POST(
  request: Request,
  { params }: { params: { tripId: string; stopId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { tripId, stopId } = params;

    // Verify user owns the trip
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    // Verify stop belongs to trip
    const stop = await Stop.findOne({ _id: stopId, tripId });
    if (!stop) return NextResponse.json({ error: 'Stop not found in this trip' }, { status: 404 });

    const body = await request.json();
    const { name, type, estimatedCost, duration, description } = body;

    if (!name) return NextResponse.json({ error: 'Activity name is required' }, { status: 400 });

    const newActivity = await Activity.create({
      stopId,
      name,
      description: description || "",
      type: (type || 'sightseeing').toLowerCase(),
      cost: estimatedCost || 0,
      duration: duration?.toString() || "1",
      isCustom: false, // Marked as curated
    });

    return NextResponse.json({ success: true, activity: newActivity });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
