export interface EmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  bodyHtml?: string;
  isUnread: boolean;
  hasAttachments: boolean;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface EmailListItem {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  hasAttachments: boolean;
  labelIds: string[];
}

export interface Label {
  id: string;
  name: string;
  type: "system" | "user";
  messageListVisibility?: string;
  labelListVisibility?: string;
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface SendEmailParams {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: File[];
}

export interface EmailsResponse {
  messages: EmailListItem[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}
