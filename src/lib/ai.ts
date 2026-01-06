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
