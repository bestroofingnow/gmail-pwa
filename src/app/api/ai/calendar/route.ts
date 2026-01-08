import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { suggestMeetingTime, generateMeetingAgenda } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case "suggestTime": {
        const { description, freeSlots, preferences } = params;
        if (!description || !freeSlots) {
          return NextResponse.json(
            { error: "Description and freeSlots are required" },
            { status: 400 }
          );
        }
        const suggestion = await suggestMeetingTime(
          description,
          freeSlots,
          preferences
        );
        return NextResponse.json(suggestion);
      }

      case "generateAgenda": {
        const { meetingContext } = params;
        if (!meetingContext) {
          return NextResponse.json(
            { error: "Meeting context is required" },
            { status: 400 }
          );
        }
        const agenda = await generateMeetingAgenda(meetingContext);
        return NextResponse.json({ agenda });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Calendar AI error:", error);
    return NextResponse.json(
      { error: "Failed to process calendar AI request" },
      { status: 500 }
    );
  }
}
