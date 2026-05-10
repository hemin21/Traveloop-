import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await connectToDatabase();
    const { userId } = params;
    const body = await request.json();
    const { isAdmin } = body;

    const updatedUser = await User.findByIdAndUpdate(userId, { isAdmin }, { new: true });
    
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user admin status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await connectToDatabase();
    const { userId } = params;

    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
