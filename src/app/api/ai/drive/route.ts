import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { suggestFileOrganization } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, files } = body;

    switch (action) {
      case "organize": {
        if (!files || !Array.isArray(files)) {
          return NextResponse.json(
            { error: "Files array is required" },
            { status: 400 }
          );
        }
        const suggestions = await suggestFileOrganization(files);
        return NextResponse.json(suggestions);
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Drive AI error:", error);
    return NextResponse.json(
      { error: "Failed to process drive AI request" },
      { status: 500 }
    );
  }
}
