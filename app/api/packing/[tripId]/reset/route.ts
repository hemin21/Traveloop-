import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PackingItem from "@/lib/models/PackingItem";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(params.tripId)) {
      return new NextResponse("Invalid trip ID", { status: 400 });
    }
    
    // Reset all isPacked flags to false for this trip
    await PackingItem.updateMany(
      { tripId: new mongoose.Types.ObjectId(params.tripId) },
      { isPacked: false }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PACKING_RESET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
