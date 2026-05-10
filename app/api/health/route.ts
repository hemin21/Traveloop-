import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const state = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    return NextResponse.json({
      status: "ok",
      db: states[state] || "unknown",
      dbName: mongoose.connection.db?.databaseName || "unknown",
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}
