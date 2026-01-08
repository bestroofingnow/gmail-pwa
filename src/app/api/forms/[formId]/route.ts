import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getForm,
  updateForm,
  addFormQuestion,
  getFormResponses,
} from "@/lib/forms";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { formId } = await params;
    const includeResponses = request.nextUrl.searchParams.get("responses") === "true";

    if (includeResponses) {
      const pageToken = request.nextUrl.searchParams.get("pageToken") || undefined;
      const pageSize = request.nextUrl.searchParams.get("pageSize")
        ? parseInt(request.nextUrl.searchParams.get("pageSize")!)
        : undefined;

      const responses = await getFormResponses(session.accessToken, formId, {
        pageToken,
        pageSize,
      });
      return NextResponse.json(responses);
    } else {
      const form = await getForm(session.accessToken, formId);
      return NextResponse.json(form);
    }
  } catch (error) {
    console.error("Get form error:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { formId } = await params;
    const body = await request.json();
    const { title, description } = body;

    await updateForm(session.accessToken, formId, { title, description });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update form error:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { formId } = await params;
    const body = await request.json();
    const { action, question, index } = body;

    if (action === "addQuestion") {
      if (!question || !question.title || !question.type) {
        return NextResponse.json(
          { error: "Question title and type are required" },
          { status: 400 }
        );
      }

      await addFormQuestion(session.accessToken, formId, question, index);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Form action error:", error);
    return NextResponse.json(
      { error: "Failed to perform form action" },
      { status: 500 }
    );
  }
}
