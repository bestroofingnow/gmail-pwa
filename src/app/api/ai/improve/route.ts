import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { improveEmailDraft } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { draft, instructions } = body;

    if (!draft) {
      return NextResponse.json(
        { error: "Missing draft content" },
        { status: 400 }
      );
    }

    const improved = await improveEmailDraft(draft, instructions);

    return NextResponse.json({ improved });
  } catch (error) {
    console.error("Error improving draft:", error);
    return NextResponse.json(
      { error: "Failed to improve draft" },
      { status: 500 }
    );
  }
}
