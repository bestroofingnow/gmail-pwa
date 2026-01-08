import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Vercel AI Gateway with Groq provider
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

const MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct";

export interface EmailContext {
  subject: string;
  from: string;
  to: string;
  body: string;
  date: string;
}

export async function summarizeEmail(email: EmailContext): Promise<string> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI email assistant. Summarize emails concisely in 2-3 sentences, highlighting the key points and any action items. Be direct and professional.`,
    prompt: `Please summarize this email:

From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Date: ${email.date}

${email.body}`,
  });

  return text || "Unable to generate summary.";
}

export async function generateReply(
  email: EmailContext,
  tone: "professional" | "friendly" | "brief" = "professional",
  customInstructions?: string
): Promise<string> {
  const toneDescriptions = {
    professional: "formal and professional",
    friendly: "warm and friendly while remaining professional",
    brief: "concise and to the point",
  };

  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI email assistant helping to draft email replies. Write replies that are ${toneDescriptions[tone]}.

Rules:
- Do NOT include subject line
- Do NOT include "Dear" or formal salutations unless appropriate
- Start directly with the response content
- End with an appropriate sign-off
- Keep the response relevant and helpful
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ""}`,
    prompt: `Please draft a reply to this email:

From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}

${email.body}`,
  });

  return text || "Unable to generate reply.";
}

export async function categorizeEmail(email: EmailContext): Promise<{
  category: string;
  priority: "high" | "medium" | "low";
  suggestedLabels: string[];
  actionRequired: boolean;
  actionSummary?: string;
}> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI email assistant that categorizes emails. Analyze the email and return a JSON object with:
- category: one of "work", "personal", "newsletter", "promotional", "social", "finance", "travel", "shopping", "updates", "other"
- priority: "high", "medium", or "low" based on urgency and importance
- suggestedLabels: array of 1-3 relevant labels
- actionRequired: boolean indicating if the email requires a response or action
- actionSummary: if actionRequired is true, a brief description of what action is needed

Return ONLY valid JSON, no other text.`,
    prompt: `Categorize this email:

From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}

${email.body}`,
  });

  try {
    const content = text || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found");
  } catch {
    return {
      category: "other",
      priority: "medium",
      suggestedLabels: [],
      actionRequired: false,
    };
  }
}

export async function improveEmailDraft(
  draft: string,
  instructions?: string
): Promise<string> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI email assistant that improves email drafts. Make the email clearer, more professional, and more effective while preserving the original intent and meaning.
${instructions ? `\nSpecific instructions: ${instructions}` : ""}

Return only the improved email text, no explanations.`,
    prompt: `Please improve this email draft:\n\n${draft}`,
  });

  return text || draft;
}

export async function extractActionItems(email: EmailContext): Promise<string[]> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI email assistant that extracts action items from emails. List any tasks, requests, deadlines, or follow-ups mentioned in the email.

Return a JSON array of strings, each being a specific action item. If no action items, return an empty array [].
Return ONLY the JSON array, no other text.`,
    prompt: `Extract action items from this email:

From: ${email.from}
Subject: ${email.subject}

${email.body}`,
  });

  try {
    const content = text || "[]";
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    return [];
  } catch {
    return [];
  }
}

// Calendar AI Features
export interface CalendarContext {
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
  location?: string;
}

export async function suggestMeetingTime(
  description: string,
  freeSlots: { start: string; end: string }[],
  preferences?: string
): Promise<{
  suggestedSlot: { start: string; end: string };
  reasoning: string;
}> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI scheduling assistant. Given a meeting description, available time slots, and optional preferences, suggest the best time slot.

Return a JSON object with:
- suggestedSlot: { start: ISO date string, end: ISO date string }
- reasoning: brief explanation of why this slot was chosen

Consider factors like:
- Time of day preferences (morning meetings for important discussions, afternoon for casual)
- Buffer time between meetings
- Meeting duration requirements
- Any stated preferences

Return ONLY valid JSON, no other text.`,
    prompt: `Meeting description: ${description}

Available slots:
${freeSlots.map((slot) => `- ${slot.start} to ${slot.end}`).join("\n")}

${preferences ? `Preferences: ${preferences}` : ""}

Suggest the best time slot:`,
  });

  try {
    const content = text || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found");
  } catch {
    return {
      suggestedSlot: freeSlots[0] || { start: "", end: "" },
      reasoning: "Using the first available slot.",
    };
  }
}

export async function generateMeetingAgenda(
  meetingContext: CalendarContext
): Promise<string> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI meeting assistant. Generate a professional meeting agenda based on the meeting details provided.

Include:
- Meeting objectives
- Key discussion topics
- Time allocations if appropriate
- Action items to address

Keep it concise and well-organized.`,
    prompt: `Generate a meeting agenda for:

Meeting: ${meetingContext.summary}
${meetingContext.description ? `Description: ${meetingContext.description}` : ""}
Time: ${meetingContext.start} to ${meetingContext.end}
${meetingContext.attendees?.length ? `Attendees: ${meetingContext.attendees.join(", ")}` : ""}
${meetingContext.location ? `Location: ${meetingContext.location}` : ""}`,
  });

  return text || "Unable to generate agenda.";
}

// Document AI Features
export async function summarizeDocument(content: string): Promise<string> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI document assistant. Summarize the document content concisely, highlighting:
- Main topics and themes
- Key points and conclusions
- Important data or findings
- Action items or recommendations

Keep the summary to 2-4 paragraphs.`,
    prompt: `Summarize this document:

${content.slice(0, 10000)}`, // Limit content length
  });

  return text || "Unable to generate summary.";
}

export async function analyzeSpreadsheetData(
  headers: string[],
  sampleData: string[][],
  question: string
): Promise<string> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI data analyst. Analyze the spreadsheet data and answer questions about it.

Provide insights based on:
- Data patterns and trends
- Statistical observations
- Anomalies or outliers
- Recommendations based on the data

Be specific and reference the actual data when possible.`,
    prompt: `Spreadsheet headers: ${headers.join(", ")}

Sample data (first rows):
${sampleData.slice(0, 20).map((row) => row.join(" | ")).join("\n")}

Question: ${question}`,
  });

  return text || "Unable to analyze data.";
}

export async function generateFormQuestions(
  topic: string,
  purpose: string,
  questionCount: number = 5
): Promise<{
  title: string;
  questions: {
    title: string;
    type: "SHORT_TEXT" | "PARAGRAPH" | "MULTIPLE_CHOICE" | "CHECKBOXES" | "SCALE";
    options?: string[];
    required: boolean;
  }[];
}> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI form builder. Generate form questions based on the topic and purpose.

Return a JSON object with:
- title: A clear form title
- questions: Array of question objects with:
  - title: The question text
  - type: One of "SHORT_TEXT", "PARAGRAPH", "MULTIPLE_CHOICE", "CHECKBOXES", "SCALE"
  - options: Array of options (only for MULTIPLE_CHOICE, CHECKBOXES)
  - required: Boolean

Make questions clear, relevant, and well-structured.
Return ONLY valid JSON, no other text.`,
    prompt: `Create a form about: ${topic}
Purpose: ${purpose}
Number of questions: ${questionCount}`,
  });

  try {
    const content = text || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found");
  } catch {
    return {
      title: topic,
      questions: [
        {
          title: "Please share your thoughts",
          type: "PARAGRAPH",
          required: false,
        },
      ],
    };
  }
}

export async function analyzeFormResponses(
  questions: { title: string; type: string }[],
  responses: { [questionTitle: string]: string[] }[]
): Promise<{
  summary: string;
  insights: string[];
  recommendations: string[];
}> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI form response analyst. Analyze the form responses and provide:
- A summary of the responses
- Key insights and patterns
- Recommendations based on the data

Return a JSON object with:
- summary: Overall summary paragraph
- insights: Array of insight strings
- recommendations: Array of recommendation strings

Return ONLY valid JSON, no other text.`,
    prompt: `Form questions:
${questions.map((q) => `- ${q.title} (${q.type})`).join("\n")}

Responses (${responses.length} total):
${JSON.stringify(responses.slice(0, 50), null, 2)}

Analyze these responses:`,
  });

  try {
    const content = text || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found");
  } catch {
    return {
      summary: "Unable to analyze responses.",
      insights: [],
      recommendations: [],
    };
  }
}

// Drive AI Features
export async function suggestFileOrganization(
  files: { name: string; mimeType: string; modifiedTime?: string }[]
): Promise<{
  suggestedFolders: string[];
  fileAssignments: { fileName: string; suggestedFolder: string }[];
}> {
  const { text } = await generateText({
    model: groq(MODEL),
    system: `You are an AI file organization assistant. Analyze the list of files and suggest a folder structure.

Return a JSON object with:
- suggestedFolders: Array of folder names to create
- fileAssignments: Array of { fileName, suggestedFolder } objects

Consider file types, naming patterns, and common organizational practices.
Return ONLY valid JSON, no other text.`,
    prompt: `Organize these files:
${files.slice(0, 50).map((f) => `- ${f.name} (${f.mimeType})`).join("\n")}`,
  });

  try {
    const content = text || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found");
  } catch {
    return {
      suggestedFolders: [],
      fileAssignments: [],
    };
  }
}
