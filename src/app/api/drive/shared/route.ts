import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listSharedWithMe } from "@/lib/drive";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const pageToken = searchParams.get("pageToken") || undefined;
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : undefined;

    const result = await listSharedWithMe(session.accessToken, {
      pageToken,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Shared files error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared files" },
      { status: 500 }
    );
  }
}
