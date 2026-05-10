import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select("-password");
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { phone, city, country, additionalInfo, firstName, lastName, email, preferredCurrency } = body;

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          ...(phone !== undefined && { phone }),
          ...(city !== undefined && { city }),
          ...(country !== undefined && { country }),
          ...(additionalInfo !== undefined && { additionalInfo }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
          ...(preferredCurrency && { preferredCurrency }),
        }
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
       return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("[PROFILE_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();
    await User.findByIdAndDelete(session.user.id);

    // Destroy the cookie too
    const response = NextResponse.json({ success: true });
    response.cookies.delete("traveloop-session");
    return response;
  } catch (error: any) {
    console.error("[PROFILE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
