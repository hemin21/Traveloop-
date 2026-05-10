import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Trip from '@/lib/models/Trip';
import CommunityPost from '@/lib/models/CommunityPost';

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  await connectDB();
  const user = await User.findById(session.user.id).select('isAdmin').lean();
  return (user as any)?.isAdmin ? session : null;
}

// GET /api/admin/stats
export async function GET() {
  try {
    const adminSession = await requireAdmin();
    if (!adminSession) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [totalUsers, totalTrips, totalPosts, recentUsers, recentTrips] = await Promise.all([
      User.countDocuments(),
      Trip.countDocuments(),
      CommunityPost.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select('-password').lean(),
      Trip.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return NextResponse.json({
      stats: { totalUsers, totalTrips, totalPosts },
      recentUsers,
      recentTrips,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
