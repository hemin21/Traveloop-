import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Trip from '@/lib/models/Trip';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    
    // Find the trip
    const trip = await Trip.findOne({ _id: params.tripId, userId });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    // If it already has a share token, return it
    if (trip.shareToken) {
      return NextResponse.json({ 
        shareToken: trip.shareToken,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${trip.shareToken}`
      });
    }

    // Generate a new UUID-like token
    const shareToken = crypto.randomUUID();
    trip.shareToken = shareToken;
    trip.isPublic = true;
    await trip.save();

    return NextResponse.json({ 
      shareToken: trip.shareToken,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${trip.shareToken}`
    });
  } catch (error) {
    console.error("Error generating share token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
