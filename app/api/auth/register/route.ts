import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { login } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, password, firstName, lastName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: firstName || "",
      lastName: lastName || "",
      savedDestinations: [],
      isAdmin: false,
      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`
    });

    // Automatically log user in
    await login({ 
      id: newUser._id.toString(), 
      email: newUser.email, 
      isAdmin: newUser.isAdmin 
    });

    return NextResponse.json({ 
      message: "User registered successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName
      }
    }, { status: 201 });

  } catch (error: any) {
    const fs = require('fs');
    fs.appendFileSync('registration-error.log', `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n\n`);
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Something went wrong: " + error.message }, { status: 500 });
  }
}
