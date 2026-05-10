import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Trip from '@/lib/models/Trip';
import Stop from '@/lib/models/Stop';
import Activity from '@/lib/models/Activity';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tripId = params.tripId;
    await connectToDatabase();

    // Verify trip ownership or visibility
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or unauthorized' }, { status: 404 });
    }

    // Fetch stops
    const stops = await Stop.find({ tripId }).sort({ order: 1 }).lean();

    if (stops.length === 0) {
      return NextResponse.json([]);
    }

    // Batch-fetch ALL activities for all stops in ONE query (eliminates N+1)
    const stopIds = stops.map((s: any) => s._id);
    const allActivities = await Activity.find({ stopId: { $in: stopIds } }).lean();

    // Group activities by stopId for O(1) lookup
    const activitiesByStopId: Record<string, any[]> = {};
    for (const act of allActivities as any[]) {
      const key = act.stopId.toString();
      if (!activitiesByStopId[key]) activitiesByStopId[key] = [];
      activitiesByStopId[key].push({
        ...act,
        _id: act._id.toString(),
        cost: act.cost || 0,
      });
    }

    // Assemble result in memory — no more per-stop DB calls
    const populatedStops = stops.map((stop: any) => ({
      ...stop,
      _id: stop._id.toString(),
      cityName: stop.city,
      activities: activitiesByStopId[stop._id.toString()] || [],
    }));

    return NextResponse.json(populatedStops);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tripId = params.tripId;
    await connectToDatabase();

    // Verify trip belongs to user
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or unauthorized' }, { status: 404 });
    }

    const { stops } = await request.json();
    if (!Array.isArray(stops)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Find old stops to delete their activities, then bulk-delete both
    const existingStops = await Stop.find({ tripId }).select('_id').lean();
    const oldStopIds = existingStops.map((s: any) => s._id);

    await Promise.all([
      Activity.deleteMany({ stopId: { $in: oldStopIds } }),
      Stop.deleteMany({ tripId }),
    ]);

    // Build all stop docs at once and bulk-insert
    const stopDocs = stops.map((stopInput: any, index: number) => ({
      tripId,
      city: stopInput.city || 'Unknown',
      country: stopInput.country,
      startDate: stopInput.startDate ? new Date(stopInput.startDate) : undefined,
      endDate: stopInput.endDate ? new Date(stopInput.endDate) : undefined,
      budget: parseFloat(stopInput.budget) || 0,
      notes: stopInput.notes,
      order: index,
    }));

    const createdStops = await Stop.insertMany(stopDocs);

    // Build all activity docs and bulk-insert in one call
    const activityDocs: any[] = [];
    for (let i = 0; i < stops.length; i++) {
      const stopInput = stops[i];
      const createdStop = createdStops[i];
      if (Array.isArray(stopInput.activities) && stopInput.activities.length > 0) {
        for (const act of stopInput.activities) {
          activityDocs.push({
            stopId: createdStop._id,
            name: act.name || 'New Activity',
            type: act.type || 'sightseeing',
            cost: parseFloat(act.cost) || 0,
            duration: act.duration,
            isCustom: true,
          });
        }
      }
    }

    if (activityDocs.length > 0) {
      await Activity.insertMany(activityDocs);
    }

    // Update Trip's stop reference list
    const newStopIds = createdStops.map((s: any) => s._id);
    trip.stops = newStopIds;
    await trip.save();

    return NextResponse.json({ success: true, count: newStopIds.length });
  } catch (error: any) {
    console.error('Save stops error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save stops' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { tripId } = params;

    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    const body = await request.json();
    const { city, country } = body;

    if (!city) return NextResponse.json({ error: 'City is required' }, { status: 400 });

    // Count existing stops to set the next sequential order
    const existingCount = await Stop.countDocuments({ tripId });

    const newStop = await Stop.create({
      tripId,
      city,
      country: country || "",
      order: existingCount,
    });

    // Update trip to include reference
    await Trip.findByIdAndUpdate(tripId, { $push: { stops: newStop._id } });

    return NextResponse.json({ success: true, stop: newStop });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
