import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { summarizeDocument } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, content } = body;

    switch (action) {
      case "summarize": {
        if (!content) {
          return NextResponse.json(
            { error: "Content is required" },
            { status: 400 }
          );
        }
        const summary = await summarizeDocument(content);
        return NextResponse.json({ summary });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Docs AI error:", error);
    return NextResponse.json(
      { error: "Failed to process document AI request" },
      { status: 500 }
    );
  }
}
