import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getSpreadsheet,
  getSheetValues,
  updateSheetValues,
  appendSheetValues,
  clearSheetValues,
  addSheet,
  deleteSheet,
} from "@/lib/sheets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spreadsheetId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { spreadsheetId } = await params;
    const range = request.nextUrl.searchParams.get("range");

    if (range) {
      // Get specific range values
      const data = await getSheetValues(session.accessToken, spreadsheetId, range);
      return NextResponse.json(data);
    } else {
      // Get spreadsheet metadata
      const spreadsheet = await getSpreadsheet(session.accessToken, spreadsheetId);
      return NextResponse.json(spreadsheet);
    }
  } catch (error) {
    console.error("Get spreadsheet error:", error);
    return NextResponse.json(
      { error: "Failed to fetch spreadsheet" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ spreadsheetId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { spreadsheetId } = await params;
    const body = await request.json();
    const { range, values, inputOption } = body;

    if (!range || !values) {
      return NextResponse.json(
        { error: "Range and values are required" },
        { status: 400 }
      );
    }

    const result = await updateSheetValues(
      session.accessToken,
      spreadsheetId,
      range,
      values,
      inputOption
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update spreadsheet error:", error);
    return NextResponse.json(
      { error: "Failed to update spreadsheet" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spreadsheetId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { spreadsheetId } = await params;
    const body = await request.json();
    const { action, range, values, inputOption, title, sheetId } = body;

    switch (action) {
      case "append":
        if (!range || !values) {
          return NextResponse.json(
            { error: "Range and values are required for append" },
            { status: 400 }
          );
        }
        const appendResult = await appendSheetValues(
          session.accessToken,
          spreadsheetId,
          range,
          values,
          inputOption
        );
        return NextResponse.json(appendResult);

      case "clear":
        if (!range) {
          return NextResponse.json(
            { error: "Range is required for clear" },
            { status: 400 }
          );
        }
        const clearResult = await clearSheetValues(
          session.accessToken,
          spreadsheetId,
          range
        );
        return NextResponse.json(clearResult);

      case "addSheet":
        if (!title) {
          return NextResponse.json(
            { error: "Title is required for addSheet" },
            { status: 400 }
          );
        }
        const sheet = await addSheet(session.accessToken, spreadsheetId, title);
        return NextResponse.json(sheet);

      case "deleteSheet":
        if (sheetId === undefined) {
          return NextResponse.json(
            { error: "SheetId is required for deleteSheet" },
            { status: 400 }
          );
        }
        await deleteSheet(session.accessToken, spreadsheetId, sheetId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Spreadsheet action error:", error);
    return NextResponse.json(
      { error: "Failed to perform spreadsheet action" },
      { status: 500 }
    );
  }
}
