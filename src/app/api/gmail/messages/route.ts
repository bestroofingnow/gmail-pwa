import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMessages } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const maxResults = parseInt(searchParams.get("maxResults") || "20");
    const pageToken = searchParams.get("pageToken") || undefined;
    const labelIds = searchParams.get("labelIds")?.split(",").filter(Boolean);
    const q = searchParams.get("q") || undefined;

    const result = await getMessages(session.accessToken, {
      maxResults,
      pageToken,
      labelIds,
      q,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
