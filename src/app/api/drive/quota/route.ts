import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStorageQuota } from "@/lib/drive";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quota = await getStorageQuota(session.accessToken);
    return NextResponse.json(quota);
  } catch (error) {
    console.error("Storage quota error:", error);
    return NextResponse.json(
      { error: "Failed to fetch storage quota" },
      { status: 500 }
    );
  }
}
