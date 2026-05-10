import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST() {
  try {
    logout();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Error logging out" }, { status: 500 });
  }
}
