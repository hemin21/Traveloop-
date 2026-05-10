import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Invoice from "@/lib/models/Invoice";
import Trip from "@/lib/models/Trip";
import Stop from "@/lib/models/Stop";
import Activity from "@/lib/models/Activity";
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
    
    let invoice = await Invoice.findOne({ tripId: new mongoose.Types.ObjectId(params.tripId) });

    // Return existing invoice if present
    if (invoice) {
      return NextResponse.json({ invoice });
    }

    // If no invoice, trigger auto-generation (convenience wrapper)
    const userName = session?.user ? `${session.user.firstName} ${session.user.lastName}`.trim() : "Traveler";
    return await generateInvoice(params.tripId, userName);
  } catch (error) {
    console.error("[INVOICE_GET]", error);
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

    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(params.tripId)) {
      return new NextResponse("Invalid trip ID", { status: 400 });
    }
    
    // Force removal of existing invoice if explicitly called via POST to regenerate
    await Invoice.findOneAndDelete({ tripId: new mongoose.Types.ObjectId(params.tripId) });

    const userName = session?.user ? `${session.user.firstName} ${session.user.lastName}`.trim() : "Traveler";
    return await generateInvoice(params.tripId, userName);
  } catch (error) {
    console.error("[INVOICE_POST]", error);
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

    const { paymentStatus } = await req.json();
    if (!paymentStatus) return new NextResponse("Status missing", { status: 400 });

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.tripId)) {
      return new NextResponse("Invalid trip ID", { status: 400 });
    }

    const updated = await Invoice.findOneAndUpdate(
      { tripId: new mongoose.Types.ObjectId(params.tripId) },
      { paymentStatus },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[INVOICE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

async function generateInvoice(tripId: string, userName: string = "Traveler") {
  try {
    const tripObjectId = new mongoose.Types.ObjectId(tripId);
    const trip = await Trip.findById(tripObjectId);
    if (!trip) return new NextResponse("Trip not found", { status: 404 });

    // Fetch stops
    const stops = await Stop.find({ tripId: tripObjectId });
    const stopIds = stops.map(s => s._id);

    // Fetch activities for those stops
    const activities = await Activity.find({ stopId: { $in: stopIds } });

    // Map activities to invoice items
    const activityItems = activities.map((act: any) => {
      const cost = act.cost || 0;
      let qty = 1;
      if (act.duration) {
        const numeric = parseFloat(act.duration.toString().replace(/[^0-9.]/g, ''));
        if (!isNaN(numeric) && numeric > 0) qty = Math.ceil(numeric);
      }
      
      return {
        category: act.type || "other",
        description: act.name || "Unknown Activity",
        qty: qty,
        unitCost: cost,
        amount: cost * qty
      };
    });

    const stopItems = stops.filter(s => s.budget && s.budget > 0).map(s => {
      let qty = 1;
      if (s.startDate && s.endDate) {
        try {
          const start = new Date(s.startDate);
          const end = new Date(s.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 0) qty = diffDays;
        } catch(e) {
          console.error("Date parsing error in generateInvoice", e);
        }
      }
      
      return {
        category: "city_budget",
        description: `Allocated budget for ${s.city || "City"}`,
        qty: 1,
        unitCost: s.budget,
        amount: s.budget
      };
    });

    const items = [...stopItems, ...activityItems];

    const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
    const tax = subtotal * 0.05; // 5%
    const discount = 0;
    const grandTotal = subtotal + tax - discount;

    const generatedId = "INV-" + tripId.slice(-5).toUpperCase() + "-" + Date.now().toString().slice(-5);

    const newInvoice = await Invoice.create({
      tripId: tripObjectId,
      invoiceId: generatedId,
      travelers: [userName],
      items,
      subtotal,
      tax,
      discount,
      grandTotal,
      paymentStatus: 'pending',
      generatedDate: new Date()
    });

    return NextResponse.json({ invoice: newInvoice });
  } catch (error) {
    console.error("[generateInvoice error]", error);
    return new NextResponse("Internal Error generating invoice", { status: 500 });
  }
}
