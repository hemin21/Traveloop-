import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Trip from '@/lib/models/Trip';
import Stop from '@/lib/models/Stop';
import Activity from '@/lib/models/Activity';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get the user's trips sorted by new creation
    const trips = await Trip.find({ userId }).sort({ createdAt: -1 }).lean();
    
    const mappedTrips = trips.map((trip: any) => ({
      ...trip,
      budget: trip.totalBudget
    }));

    return NextResponse.json(mappedTrips);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, startDate, endDate, budget, isPublic, tripType, copyFrom } = body;

    await connectToDatabase();

    // Handle Copy Logic
    if (copyFrom) {
      const sourceTrip = await Trip.findById(copyFrom).lean();
      if (!sourceTrip) {
        return NextResponse.json({ error: 'Source trip not found' }, { status: 404 });
      }

      // Create basic trip details copy
      const newTripData = {
        userId,
        title: `${sourceTrip.title} (Copy)`,
        description: sourceTrip.description,
        coverPhoto: sourceTrip.coverPhoto,
        startDate: sourceTrip.startDate,
        endDate: sourceTrip.endDate,
        totalBudget: sourceTrip.totalBudget,
        status: 'upcoming',
        isPublic: false,
        collaborators: [],
        stops: []
      };

      const clonedTrip = await Trip.create(newTripData);

      // Deep clone the stops — run all in parallel instead of serial
      const sourceStops = await Stop.find({ tripId: sourceTrip._id }).sort({ order: 1 }).lean();

      const newStopIds = await Promise.all(
        sourceStops.map(async (sStop: any) => {
          const { _id: originalStopId, createdAt, ...stopBody } = sStop;

          const clonedStop = await Stop.create({
            ...stopBody,
            tripId: clonedTrip._id,
            createdAt: new Date()
          });

          // Deep clone activities for this specific stop
          const sourceActs = await Activity.find({ stopId: originalStopId }).lean();
          if (sourceActs.length > 0) {
            const actsToCreate = sourceActs.map(({ _id, ...rest }: any) => ({
              ...rest,
              stopId: clonedStop._id
            }));
            await Activity.insertMany(actsToCreate);
          }

          return clonedStop._id;
        })
      );

      // Hydrate cloned trip with the new stop Object IDs
      clonedTrip.stops = newStopIds;
      await clonedTrip.save();

      const tripJson = clonedTrip.toObject();
      return NextResponse.json({ ...tripJson, budget: tripJson.totalBudget }, { status: 201 });
    }

    // DEFAULT CREATE LOGIC
    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newTrip = await Trip.create({
      userId,
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalBudget: budget || 0,
      isPublic: isPublic || false,
      status: 'upcoming', // Default status
      stops: [],
    });

    const tripJson = newTrip.toObject();
    return NextResponse.json({ ...tripJson, budget: tripJson.totalBudget }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create trip:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
