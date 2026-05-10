import { NextResponse } from 'next/server';
import { getSession, getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import CommunityPost from '@/lib/models/CommunityPost';
import Trip from '@/lib/models/Trip';
import Stop from '@/lib/models/Stop';
import { differenceInDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const currentUserId = session?.user?.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Fetch posts with the trip data already populated in one query
    const posts = await CommunityPost.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'tripId', model: Trip })
      .lean();

    // Collect all unique tripIds for a single batch stop query (eliminates N+1)
    const tripIds = posts
      .map((p: any) => p.tripId?._id)
      .filter(Boolean);

    // ONE query for all stops instead of one per post
    const allStops = tripIds.length > 0
      ? await Stop.find({ tripId: { $in: tripIds } }).sort({ order: 1 }).lean()
      : [];

    // Group stops by tripId string for O(1) lookup
    const stopsByTripId: Record<string, string[]> = {};
    for (const stop of allStops as any[]) {
      const key = stop.tripId.toString();
      if (!stopsByTripId[key]) stopsByTripId[key] = [];
      stopsByTripId[key].push(stop.city);
    }

    // Map posts to frontend format (no more DB calls in the loop)
    const formattedPosts = posts
      .map((post: any) => {
        const trip = post.tripId;
        if (!trip) return null;

        const route = stopsByTripId[trip._id.toString()] || [];

        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const duration = Math.max(1, differenceInDays(end, start) + 1);

        return {
          _id: post._id,
          createdAt: post.createdAt,
          content: post.content,
          likes: post.likes?.length || 0,
          isLikedByMe: currentUserId ? (post.likes?.includes(currentUserId) || false) : false,
          comments: 0,
          copies: 0,
          user: {
            name: post.userName,
            initials: post.userName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U',
            avatar: post.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userName}`
          },
          trip: {
            _id: trip._id,
            title: trip.title,
            route,
            startDate: trip.startDate,
            endDate: trip.endDate,
            durationDays: duration,
            budget: trip.totalBudget ? `$${trip.totalBudget.toLocaleString()}` : undefined,
            tags: post.tags || [],
            region: post.region || "Unknown",
            tripType: post.tripType || "Vacation"
          }
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        count: formattedPosts.length
      }
    });
  } catch (error: any) {
    console.error('Failed to get community feed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tripId, content, region, tripType, tags } = body;

    if (!tripId) {
      return NextResponse.json({ error: 'Missing tripId' }, { status: 400 });
    }

    await connectToDatabase();

    // Validate trip existence and accessibility
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Ensure public state
    if (!trip.isPublic) {
      trip.isPublic = true;
      await trip.save();
    }

    // Prepare metadata
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || "Traveler";
    const userPhoto = user.imageUrl;

    const newPost = await CommunityPost.create({
      userId: user.id,
      tripId: trip._id,
      userName,
      userPhoto,
      content: content || `Sharing my trip: ${trip.title}`,
      region: region || "Global",
      tripType: tripType || "Group",
      tags: Array.isArray(tags) ? tags : [],
      likes: [],
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

