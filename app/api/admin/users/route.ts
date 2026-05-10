import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  await connectDB();
  const user = await User.findById(session.user.id).select('isAdmin').lean();
  return (user as any)?.isAdmin ? session : null;
}

// GET /api/admin/users — paginated user list
export async function GET(req: Request) {
  try {
    const adminSession = await requireAdmin();
    if (!adminSession) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = searchParams.get('q') || '';

    const query = search
      ? { $or: [{ email: { $regex: search, $options: 'i' } }, { firstName: { $regex: search, $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password').lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/users — toggle isAdmin or disable user
export async function PATCH(req: Request) {
  try {
    const adminSession = await requireAdmin();
    if (!adminSession) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userId, isAdmin } = await req.json();
    const updated = await User.findByIdAndUpdate(userId, { isAdmin }, { new: true }).select('-password').lean();
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/users — delete a user
export async function DELETE(req: Request) {
  try {
    const adminSession = await requireAdmin();
    if (!adminSession) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    await User.findByIdAndDelete(userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
