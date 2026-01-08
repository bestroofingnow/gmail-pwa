import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listSpreadsheets, createSpreadsheet } from "@/lib/sheets";

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

    const result = await listSpreadsheets(session.accessToken, {
      pageToken,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("List spreadsheets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch spreadsheets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, sheetTitles } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const spreadsheet = await createSpreadsheet(
      session.accessToken,
      title,
      sheetTitles
    );

    return NextResponse.json(spreadsheet);
  } catch (error) {
    console.error("Create spreadsheet error:", error);
    return NextResponse.json(
      { error: "Failed to create spreadsheet" },
      { status: 500 }
    );
  }
}
