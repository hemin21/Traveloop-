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

// GET /api/admin/trips — paginated trips list
export async function GET(req: Request) {
  try {
    const adminSession = await requireAdmin();
    if (!adminSession) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      Trip.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Trip.countDocuments(),
    ]);

    return NextResponse.json({ trips, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/trips — delete a trip
export async function DELETE(req: Request) {
  try {
    const adminSession = await requireAdmin();
    if (!adminSession) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('tripId');
    if (!tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 });

    await Promise.all([
      Trip.findByIdAndDelete(tripId),
      CommunityPost.deleteMany({ tripId }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
