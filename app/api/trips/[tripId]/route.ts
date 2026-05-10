import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Trip from '@/lib/models/Trip';
import Stop from '@/lib/models/Stop';
import Activity from '@/lib/models/Activity';

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

    await connectToDatabase();
    
    // Check both authorship or collaboration (if added in model later)
    const trip = await Trip.findOne({ _id: params.tripId, userId }).lean();
    
    if (!trip) {
      // Check if trip is public (for basic view, but usually the /share route handles this better)
      const publicTrip = await Trip.findOne({ _id: params.tripId, isPublic: true }).lean();
      if (!publicTrip) {
         return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
      return NextResponse.json(await getFullTripData(publicTrip));
    }

    return NextResponse.json(await getFullTripData(trip));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    await connectToDatabase();
    
    const tripId = params.tripId;
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    const stops = await Stop.find({ tripId });
    const stopIds = stops.map(s => s._id);
    
    await Activity.deleteMany({ stopId: { $in: stopIds } });
    await Stop.deleteMany({ tripId });
    await Trip.deleteOne({ _id: tripId });

    return NextResponse.json({ success: true, message: "Trip deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Helper to fetch full deeply nested structure
async function getFullTripData(trip: any) {
  // Load stops sorted by order
  const stops = await Stop.find({ tripId: trip._id }).sort({ order: 1 }).lean();
  
  // Hydrate each stop with its activities
  const populatedStops = await Promise.all(
    stops.map(async (stop: any) => {
      const activities = await Activity.find({ stopId: stop._id }).lean();
      // Format activities so client doesn't need to parse _id vs id
      const mappedActivities = activities.map((a: any) => ({
        ...a,
        id: a._id.toString(), // Client side relies on .id
      }));
      
      return {
        ...stop,
        id: stop._id.toString(), // For consistency
        activities: mappedActivities,
      };
    })
  );

  return {
    ...trip,
    id: trip._id.toString(),
    stops: populatedStops,
    budget: trip.totalBudget, // Map totalBudget to budget for frontend compatibility
  };
}
