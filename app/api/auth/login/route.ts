import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { login } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Only allow traditional login if user has a password set (prevents OAuth-only bypasses)
    if (!user.password) {
       return NextResponse.json({ error: "Account was created without a password. Please reset password or use provider login if implemented." }, { status: 401 });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create session
    await login({ 
      id: user._id.toString(), 
      email: user.email, 
      isAdmin: user.isAdmin 
    });

    return NextResponse.json({ 
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        isAdmin: user.isAdmin
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Something went wrong during login." }, { status: 500 });
  }
}
