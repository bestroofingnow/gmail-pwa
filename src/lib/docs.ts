import { google } from "googleapis";

export interface Document {
  id: string;
  title: string;
  body?: string;
  revisionId?: string;
  webViewLink?: string;
}

export interface DocumentContent {
  text: string;
  structuralElements?: {
    startIndex: number;
    endIndex: number;
    paragraph?: {
      elements: {
        startIndex: number;
        endIndex: number;
        textRun?: {
          content: string;
          bold?: boolean;
          italic?: boolean;
          underline?: boolean;
        };
      }[];
    };
  }[];
}

function getDocsClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.docs({ version: "v1", auth });
}

function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

export async function listDocuments(
  accessToken: string,
  options: {
    pageToken?: string;
    pageSize?: number;
  } = {}
): Promise<{ documents: { id: string; name: string; modifiedTime?: string }[]; nextPageToken?: string }> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.document' and trashed = false",
    pageToken: options.pageToken,
    pageSize: options.pageSize || 50,
    orderBy: "modifiedTime desc",
    fields: "nextPageToken, files(id, name, modifiedTime)",
  });

  const documents = (response.data.files || []).map((file) => ({
    id: file.id || "",
    name: file.name || "",
    modifiedTime: file.modifiedTime ?? undefined,
  }));

  return {
    documents,
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}

export async function getDocument(
  accessToken: string,
  documentId: string
): Promise<Document> {
  const docs = getDocsClient(accessToken);

  const response = await docs.documents.get({
    documentId,
  });

  const data = response.data;

  // Extract text content from body
  let bodyText = "";
  if (data.body?.content) {
    for (const element of data.body.content) {
      if (element.paragraph?.elements) {
        for (const textElement of element.paragraph.elements) {
          if (textElement.textRun?.content) {
            bodyText += textElement.textRun.content;
          }
        }
      }
    }
  }

  return {
    id: data.documentId || "",
    title: data.title || "",
    body: bodyText,
    revisionId: data.revisionId ?? undefined,
    webViewLink: `https://docs.google.com/document/d/${data.documentId}/edit`,
  };
}

export async function createDocument(
  accessToken: string,
  title: string,
  content?: string
): Promise<Document> {
  const docs = getDocsClient(accessToken);

  // Create the document
  const createResponse = await docs.documents.create({
    requestBody: { title },
  });

  const documentId = createResponse.data.documentId!;

  // If content is provided, insert it
  if (content) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      },
    });
  }

  return {
    id: documentId,
    title: createResponse.data.title || title,
    body: content || "",
    webViewLink: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

export async function updateDocument(
  accessToken: string,
  documentId: string,
  requests: {
    insertText?: {
      location: { index: number };
      text: string;
    };
    deleteContentRange?: {
      range: { startIndex: number; endIndex: number };
    };
    replaceAllText?: {
      containsText: { text: string; matchCase?: boolean };
      replaceText: string;
    };
  }[]
): Promise<void> {
  const docs = getDocsClient(accessToken);

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests },
  });
}

export async function appendToDocument(
  accessToken: string,
  documentId: string,
  text: string
): Promise<void> {
  const docs = getDocsClient(accessToken);

  // First, get the document to find the end index
  const doc = await docs.documents.get({ documentId });
  const endIndex =
    doc.data.body?.content?.reduce((max, element) => {
      return Math.max(max, element.endIndex || 0);
    }, 0) || 1;

  // Insert at the end (before the final newline)
  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: endIndex - 1 },
            text,
          },
        },
      ],
    },
  });
}

export async function replaceTextInDocument(
  accessToken: string,
  documentId: string,
  searchText: string,
  replaceText: string,
  matchCase: boolean = false
): Promise<void> {
  const docs = getDocsClient(accessToken);

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          replaceAllText: {
            containsText: { text: searchText, matchCase },
            replaceText,
          },
        },
      ],
    },
  });
}

export async function getDocumentContent(
  accessToken: string,
  documentId: string
): Promise<DocumentContent> {
  const docs = getDocsClient(accessToken);

  const response = await docs.documents.get({
    documentId,
  });

  let fullText = "";
  const structuralElements: DocumentContent["structuralElements"] = [];

  if (response.data.body?.content) {
    for (const element of response.data.body.content) {
      if (element.paragraph?.elements) {
        const paragraphElements: {
          startIndex: number;
          endIndex: number;
          textRun?: {
            content: string;
            bold?: boolean;
            italic?: boolean;
            underline?: boolean;
          };
        }[] = [];

        for (const textElement of element.paragraph.elements) {
          if (textElement.textRun?.content) {
            fullText += textElement.textRun.content;
            paragraphElements.push({
              startIndex: textElement.startIndex || 0,
              endIndex: textElement.endIndex || 0,
              textRun: {
                content: textElement.textRun.content,
                bold: textElement.textRun.textStyle?.bold ?? undefined,
                italic: textElement.textRun.textStyle?.italic ?? undefined,
                underline: textElement.textRun.textStyle?.underline ?? undefined,
              },
            });
          }
        }

        structuralElements.push({
          startIndex: element.startIndex || 0,
          endIndex: element.endIndex || 0,
          paragraph: { elements: paragraphElements },
        });
      }
    }
  }

  return {
    text: fullText,
    structuralElements,
  };
}
