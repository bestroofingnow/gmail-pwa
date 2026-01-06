import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractActionItems } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, from, to, body: emailBody, date } = body;

    if (!subject || !from || !emailBody) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const actions = await extractActionItems({
      subject,
      from,
      to: to || "",
      body: emailBody,
      date: date || new Date().toISOString(),
    });

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Error extracting actions:", error);
    return NextResponse.json(
      { error: "Failed to extract action items" },
      { status: 500 }
    );
  }
}
