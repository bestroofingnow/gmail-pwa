import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findFreeSlots } from "@/lib/calendar";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { timeMin, timeMax, calendarIds, durationMinutes } = body;

    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { error: "timeMin and timeMax are required" },
        { status: 400 }
      );
    }

    const freeSlots = await findFreeSlots(
      session.accessToken,
      timeMin,
      timeMax,
      calendarIds,
      durationMinutes
    );

    return NextResponse.json({ freeSlots });
  } catch (error) {
    console.error("Free/busy error:", error);
    return NextResponse.json(
      { error: "Failed to find free slots" },
      { status: 500 }
    );
  }
}
