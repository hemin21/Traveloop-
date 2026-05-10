import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

// POST /api/admin/seed — creates the admin user if not exists
export async function POST() {
  try {
    await connectDB();

    const existing = await User.findOne({ email: 'aksharthakkar77@gmail.com' });
    if (existing) {
      // Ensure isAdmin is true even if account existed
      if (!existing.isAdmin) {
        existing.isAdmin = true;
        await existing.save();
      }
      return NextResponse.json({ message: 'Admin already exists, isAdmin ensured.' });
    }

    const hashed = await bcrypt.hash('admin@123', 12);
    await User.create({
      email: 'aksharthakkar77@gmail.com',
      password: hashed,
      firstName: 'Akshar',
      lastName: 'Thakkar',
      isAdmin: true,
    });

    return NextResponse.json({ message: 'Admin user created successfully.' });
  } catch (error: any) {
    console.error('[ADMIN_SEED]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
