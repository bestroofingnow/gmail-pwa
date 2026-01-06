import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { categorizeEmail } from "@/lib/ai";

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

    const categorization = await categorizeEmail({
      subject,
      from,
      to: to || "",
      body: emailBody,
      date: date || new Date().toISOString(),
    });

    return NextResponse.json(categorization);
  } catch (error) {
    console.error("Error categorizing email:", error);
    return NextResponse.json(
      { error: "Failed to categorize email" },
      { status: 500 }
    );
  }
}
