import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/lib/models/Note";
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

    const notes = await Note.find({ 
      tripId: new mongoose.Types.ObjectId(params.tripId) 
    }).sort({ updatedAt: -1 });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("[NOTES_GET]", error);
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

    const { title, content, stop, day } = await req.json();

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.tripId)) {
      return new NextResponse("Invalid trip ID", { status: 400 });
    }

    const note = await Note.create({
      tripId: new mongoose.Types.ObjectId(params.tripId),
      userId,
      title,
      content,
      stop,
      day: day ? parseInt(day, 10) : null
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return new NextResponse("Missing or invalid note ID", { status: 400 });
    }

    const { title, content, stop, day } = await req.json();

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.tripId)) {
      return new NextResponse("Invalid trip ID", { status: 400 });
    }

    const updatedNote = await Note.findOneAndUpdate(
      { _id: noteId, tripId: new mongoose.Types.ObjectId(params.tripId) },
      {
        $set: {
          title,
          content,
          stop,
          day: day ? parseInt(day, 10) : null
        }
      },
      { new: true }
    );

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("[NOTES_PUT]", error);
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
    const noteId = searchParams.get("noteId");

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return new NextResponse("Missing or invalid note ID", { status: 400 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.tripId)) {
      return new NextResponse("Invalid trip ID", { status: 400 });
    }

    await Note.findOneAndDelete({
      _id: noteId,
      tripId: new mongoose.Types.ObjectId(params.tripId)
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[NOTES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
