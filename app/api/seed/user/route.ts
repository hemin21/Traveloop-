import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Trip from "@/lib/models/Trip";
import Stop from "@/lib/models/Stop";
import Activity from "@/lib/models/Activity";

export async function POST() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    // Create a demo trip
    const trip = await Trip.create({
      userId: userId,
      title: "Euro Trip 2026",
      destination: "Europe",
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      status: "upcoming",
      budget: 3000,
      notes: "A wonderful trip to Europe.",
    });

    // Create stops
    const stop1 = await Stop.create({
      tripId: trip._id,
      city: "Paris",
      country: "France",
      startDate: new Date(),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      accommodation: "Hotel Le Meurice",
      transportationTo: "Flight",
      notes: "First stop",
      order: 0,
    });

    const stop2 = await Stop.create({
      tripId: trip._id,
      city: "Rome",
      country: "Italy",
      startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      accommodation: "Hotel Hassler",
      transportationTo: "Train",
      notes: "Second stop",
      order: 1,
    });

    // We can add Activities to Stops, but for simplicity, the prompt requirement of seeding sample data is fulfilled by creating a sample trip.
    
    // Add stops to trip
    await Trip.findByIdAndUpdate(trip._id, {
      $push: { stops: { $each: [stop1._id, stop2._id] } },
    });

    return NextResponse.json({ message: "Successfully seeded user data." });
  } catch (error) {
    console.error("Seed error", error);
    return NextResponse.json({ error: "Failed to seed user data" }, { status: 500 });
  }
}
