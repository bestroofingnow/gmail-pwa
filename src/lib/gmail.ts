import { google } from "googleapis";
import {
  EmailMessage,
  EmailListItem,
  Label,
  Attachment,
  EmailsResponse,
} from "@/types/gmail";

function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

function decodeBase64(str: string): string {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function encodeBase64(str: string): string {
  return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getHeader(headers: { name: string; value: string }[], name: string): string {
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || "";
}

function parseEmailBody(payload: any): { text: string; html: string } {
  let text = "";
  let html = "";

  if (payload.body?.data) {
    const decoded = decodeBase64(payload.body.data);
    if (payload.mimeType === "text/html") {
      html = decoded;
    } else {
      text = decoded;
    }
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        text = decodeBase64(part.body.data);
      } else if (part.mimeType === "text/html" && part.body?.data) {
        html = decodeBase64(part.body.data);
      } else if (part.mimeType?.startsWith("multipart/")) {
        const nested = parseEmailBody(part);
        if (nested.text) text = nested.text;
        if (nested.html) html = nested.html;
      }
    }
  }

  return { text, html };
}

function parseAttachments(payload: any, messageId: string): Attachment[] {
  const attachments: Attachment[] = [];

  function extractAttachments(part: any) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType || "application/octet-stream",
        size: part.body.size || 0,
      });
    }
    if (part.parts) {
      part.parts.forEach(extractAttachments);
    }
  }

  extractAttachments(payload);
  return attachments;
}

export async function getMessages(
  accessToken: string,
  options: {
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
    q?: string;
  } = {}
): Promise<EmailsResponse> {
  const gmail = getGmailClient(accessToken);
  const { maxResults = 20, pageToken, labelIds, q } = options;

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    pageToken,
    labelIds,
    q,
  });

  const messages: EmailListItem[] = [];

  if (response.data.messages) {
    const messagePromises = response.data.messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      const headers = detail.data.payload?.headers || [];
      const labelIds = detail.data.labelIds || [];

      return {
        id: msg.id!,
        threadId: msg.threadId!,
        subject: getHeader(headers as any, "Subject") || "(No Subject)",
        from: getHeader(headers as any, "From"),
        snippet: detail.data.snippet || "",
        date: getHeader(headers as any, "Date"),
        isUnread: labelIds.includes("UNREAD"),
        hasAttachments: detail.data.payload?.parts?.some(
          (p: any) => p.filename && p.body?.attachmentId
        ) || false,
        labelIds,
      };
    });

    const results = await Promise.all(messagePromises);
    messages.push(...results);
  }

  return {
    messages,
    nextPageToken: response.data.nextPageToken || undefined,
    resultSizeEstimate: response.data.resultSizeEstimate || 0,
  };
}

export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<EmailMessage> {
  const gmail = getGmailClient(accessToken);

  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const payload = response.data.payload!;
  const headers = payload.headers || [];
  const labelIds = response.data.labelIds || [];
  const { text, html } = parseEmailBody(payload);
  const attachments = parseAttachments(payload, messageId);

  return {
    id: response.data.id!,
    threadId: response.data.threadId!,
    labelIds,
    snippet: response.data.snippet || "",
    subject: getHeader(headers as any, "Subject") || "(No Subject)",
    from: getHeader(headers as any, "From"),
    to: getHeader(headers as any, "To"),
    date: getHeader(headers as any, "Date"),
    body: text || html,
    bodyHtml: html,
    isUnread: labelIds.includes("UNREAD"),
    hasAttachments: attachments.length > 0,
    attachments,
  };
}

export async function sendMessage(
  accessToken: string,
  params: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
  }
): Promise<{ id: string; threadId: string }> {
  const gmail = getGmailClient(accessToken);

  // Get user's email for From header
  const profile = await gmail.users.getProfile({ userId: "me" });
  const fromEmail = profile.data.emailAddress!;

  let rawMessage = `From: ${fromEmail}\r\n`;
  rawMessage += `To: ${params.to}\r\n`;
  if (params.cc) rawMessage += `Cc: ${params.cc}\r\n`;
  if (params.bcc) rawMessage += `Bcc: ${params.bcc}\r\n`;
  rawMessage += `Subject: ${params.subject}\r\n`;
  if (params.inReplyTo) rawMessage += `In-Reply-To: ${params.inReplyTo}\r\n`;
  if (params.references) rawMessage += `References: ${params.references}\r\n`;
  rawMessage += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
  rawMessage += params.body;

  const encodedMessage = encodeBase64(rawMessage);

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
      threadId: params.threadId,
    },
  });

  return {
    id: response.data.id!,
    threadId: response.data.threadId!,
  };
}

export async function deleteMessage(
  accessToken: string,
  messageId: string
): Promise<void> {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.trash({
    userId: "me",
    id: messageId,
  });
}

export async function modifyLabels(
  accessToken: string,
  messageId: string,
  addLabelIds: string[],
  removeLabelIds: string[]
): Promise<void> {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds,
      removeLabelIds,
    },
  });
}

export async function markAsRead(
  accessToken: string,
  messageId: string
): Promise<void> {
  await modifyLabels(accessToken, messageId, [], ["UNREAD"]);
}

export async function markAsUnread(
  accessToken: string,
  messageId: string
): Promise<void> {
  await modifyLabels(accessToken, messageId, ["UNREAD"], []);
}

export async function getLabels(accessToken: string): Promise<Label[]> {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.labels.list({ userId: "me" });

  return (response.data.labels || []).map((label) => ({
    id: label.id!,
    name: label.name!,
    type: label.type as "system" | "user",
    messageListVisibility: label.messageListVisibility ?? undefined,
    labelListVisibility: label.labelListVisibility ?? undefined,
    messagesTotal: label.messagesTotal ?? undefined,
    messagesUnread: label.messagesUnread ?? undefined,
  }));
}

export async function getAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<{ data: string; size: number }> {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });

  return {
    data: response.data.data!,
    size: response.data.size!,
  };
}
