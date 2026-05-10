import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PackingItem from "@/lib/models/PackingItem";
import mongoose from "mongoose";

export async function GET(
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

    const tripObjectId = new mongoose.Types.ObjectId(params.tripId);

    let items = await PackingItem.find({ tripId: tripObjectId }).lean();

    // Auto-seed defaults on first load — return inserted docs directly (no re-query)
    if (items.length === 0) {
      const defaultItems = [
        { name: "Passport", category: "Documents" },
        { name: "Flight Tickets (printed)", category: "Documents" },
        { name: "Travel Insurance", category: "Documents" },
        { name: "Hotel Booking Confirmation", category: "Documents" },
        { name: "Casual Shirts", category: "Clothing" },
        { name: "Trousers / Jeans", category: "Clothing" },
        { name: "Comfortable Walking Shoes", category: "Clothing" },
        { name: "Light Jacket / Windbreaker", category: "Clothing" },
        { name: "Phone Charger", category: "Electronics" },
        { name: "Universal Power Adapter", category: "Electronics" },
        { name: "Earphone / Headphones", category: "Electronics" }
      ].map(i => ({ ...i, userId, tripId: tripObjectId, isPacked: false }));

      items = await PackingItem.insertMany(defaultItems) as any[];
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[PACKING_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { name, category } = await req.json();

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.tripId)) {
      return new NextResponse("Invalid trip ID", { status: 400 });
    }

    const item = await PackingItem.create({
      tripId: new mongoose.Types.ObjectId(params.tripId),
      userId,
      name,
      category: category || "Other",
      isPacked: false
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("[PACKING_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { itemId, isPacked } = await req.json();

    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(params.tripId)) {
      return new NextResponse("Invalid trip ID", { status: 400 });
    }
    
    // Check if valid objectId, might be temporary ID from frontend
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return new NextResponse("Invalid ID", { status: 400 });
    }

    const item = await PackingItem.findOneAndUpdate(
      { _id: itemId, tripId: new mongoose.Types.ObjectId(params.tripId) },
      { isPacked },
      { new: true }
    );

    return NextResponse.json(item);
  } catch (error) {
    console.error("[PACKING_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return new NextResponse("Missing or invalid item ID", { status: 400 });
    }

    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(params.tripId)) {
      return new NextResponse("Invalid trip ID", { status: 400 });
    }

    await PackingItem.findOneAndDelete({
      _id: itemId,
      tripId: new mongoose.Types.ObjectId(params.tripId)
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PACKING_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
