import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getDocument,
  getDocumentContent,
  appendToDocument,
  replaceTextInDocument,
} from "@/lib/docs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId } = await params;
    const includeContent = request.nextUrl.searchParams.get("content") === "true";

    if (includeContent) {
      const content = await getDocumentContent(session.accessToken, documentId);
      return NextResponse.json(content);
    } else {
      const document = await getDocument(session.accessToken, documentId);
      return NextResponse.json(document);
    }
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId } = await params;
    const body = await request.json();
    const { action, text, searchText, replaceText, matchCase } = body;

    switch (action) {
      case "append":
        if (!text) {
          return NextResponse.json(
            { error: "Text is required for append" },
            { status: 400 }
          );
        }
        await appendToDocument(session.accessToken, documentId, text);
        return NextResponse.json({ success: true });

      case "replace":
        if (!searchText || replaceText === undefined) {
          return NextResponse.json(
            { error: "searchText and replaceText are required for replace" },
            { status: 400 }
          );
        }
        await replaceTextInDocument(
          session.accessToken,
          documentId,
          searchText,
          replaceText,
          matchCase
        );
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Document action error:", error);
    return NextResponse.json(
      { error: "Failed to perform document action" },
      { status: 500 }
    );
  }
}
