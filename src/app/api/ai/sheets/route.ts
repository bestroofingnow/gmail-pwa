import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeSpreadsheetData } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, headers, data, question } = body;

    switch (action) {
      case "analyze": {
        if (!headers || !data || !question) {
          return NextResponse.json(
            { error: "Headers, data, and question are required" },
            { status: 400 }
          );
        }
        const analysis = await analyzeSpreadsheetData(headers, data, question);
        return NextResponse.json({ analysis });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Sheets AI error:", error);
    return NextResponse.json(
      { error: "Failed to process spreadsheet AI request" },
      { status: 500 }
    );
  }
}
