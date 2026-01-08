import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateFormQuestions, analyzeFormResponses } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case "generateQuestions": {
        const { topic, purpose, questionCount } = params;
        if (!topic || !purpose) {
          return NextResponse.json(
            { error: "Topic and purpose are required" },
            { status: 400 }
          );
        }
        const formData = await generateFormQuestions(
          topic,
          purpose,
          questionCount
        );
        return NextResponse.json(formData);
      }

      case "analyzeResponses": {
        const { questions, responses } = params;
        if (!questions || !responses) {
          return NextResponse.json(
            { error: "Questions and responses are required" },
            { status: 400 }
          );
        }
        const analysis = await analyzeFormResponses(questions, responses);
        return NextResponse.json(analysis);
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Forms AI error:", error);
    return NextResponse.json(
      { error: "Failed to process forms AI request" },
      { status: 500 }
    );
  }
}
