import { google } from "googleapis";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  starred?: boolean;
  trashed?: boolean;
  shared?: boolean;
  owners?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  }[];
}

export interface DriveFolder {
  id: string;
  name: string;
  parents?: string[];
}

function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

export async function listFiles(
  accessToken: string,
  options: {
    folderId?: string;
    query?: string;
    pageToken?: string;
    pageSize?: number;
    orderBy?: string;
    mimeType?: string;
  } = {}
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const drive = getDriveClient(accessToken);

  let queryParts: string[] = [];
  if (options.folderId) {
    queryParts.push(`'${options.folderId}' in parents`);
  }
  if (options.query) {
    queryParts.push(`fullText contains '${options.query}'`);
  }
  if (options.mimeType) {
    queryParts.push(`mimeType = '${options.mimeType}'`);
  }
  queryParts.push("trashed = false");

  const response = await drive.files.list({
    q: queryParts.join(" and "),
    pageToken: options.pageToken,
    pageSize: options.pageSize || 50,
    orderBy: options.orderBy || "modifiedTime desc",
    fields:
      "nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, webContentLink, iconLink, thumbnailLink, starred, trashed, shared, owners)",
  });

  const files = (response.data.files || []).map((file) => ({
    id: file.id || "",
    name: file.name || "",
    mimeType: file.mimeType || "",
    size: file.size ?? undefined,
    createdTime: file.createdTime ?? undefined,
    modifiedTime: file.modifiedTime ?? undefined,
    parents: file.parents ?? undefined,
    webViewLink: file.webViewLink ?? undefined,
    webContentLink: file.webContentLink ?? undefined,
    iconLink: file.iconLink ?? undefined,
    thumbnailLink: file.thumbnailLink ?? undefined,
    starred: file.starred ?? undefined,
    trashed: file.trashed ?? undefined,
    shared: file.shared ?? undefined,
    owners: file.owners?.map((o) => ({
      displayName: o.displayName ?? undefined,
      emailAddress: o.emailAddress ?? undefined,
      photoLink: o.photoLink ?? undefined,
    })),
  }));

  return {
    files,
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}

export async function getFile(
  accessToken: string,
  fileId: string
): Promise<DriveFile> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.get({
    fileId,
    fields:
      "id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, webContentLink, iconLink, thumbnailLink, starred, trashed, shared, owners",
  });

  const file = response.data;
  return {
    id: file.id || "",
    name: file.name || "",
    mimeType: file.mimeType || "",
    size: file.size ?? undefined,
    createdTime: file.createdTime ?? undefined,
    modifiedTime: file.modifiedTime ?? undefined,
    parents: file.parents ?? undefined,
    webViewLink: file.webViewLink ?? undefined,
    webContentLink: file.webContentLink ?? undefined,
    iconLink: file.iconLink ?? undefined,
    thumbnailLink: file.thumbnailLink ?? undefined,
    starred: file.starred ?? undefined,
    trashed: file.trashed ?? undefined,
    shared: file.shared ?? undefined,
    owners: file.owners?.map((o) => ({
      displayName: o.displayName ?? undefined,
      emailAddress: o.emailAddress ?? undefined,
      photoLink: o.photoLink ?? undefined,
    })),
  };
}

export async function searchFiles(
  accessToken: string,
  query: string,
  options: {
    pageToken?: string;
    pageSize?: number;
  } = {}
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  return listFiles(accessToken, {
    query,
    pageToken: options.pageToken,
    pageSize: options.pageSize,
  });
}

export async function createFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<DriveFolder> {
  const drive = getDriveClient(accessToken);

  const fileMetadata: { name: string; mimeType: string; parents?: string[] } = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id, name, parents",
  });

  return {
    id: response.data.id || "",
    name: response.data.name || "",
    parents: response.data.parents ?? undefined,
  };
}

export async function uploadFile(
  accessToken: string,
  name: string,
  mimeType: string,
  content: Buffer | string,
  parentId?: string
): Promise<DriveFile> {
  const drive = getDriveClient(accessToken);

  const fileMetadata: { name: string; parents?: string[] } = { name };
  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const media = {
    mimeType,
    body: typeof content === "string" ? content : Buffer.from(content),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields:
      "id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink",
  });

  const file = response.data;
  return {
    id: file.id || "",
    name: file.name || "",
    mimeType: file.mimeType || "",
    size: file.size ?? undefined,
    createdTime: file.createdTime ?? undefined,
    modifiedTime: file.modifiedTime ?? undefined,
    webViewLink: file.webViewLink ?? undefined,
    webContentLink: file.webContentLink ?? undefined,
  };
}

export async function updateFile(
  accessToken: string,
  fileId: string,
  updates: {
    name?: string;
    starred?: boolean;
    trashed?: boolean;
    addParents?: string;
    removeParents?: string;
  }
): Promise<DriveFile> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.update({
    fileId,
    requestBody: {
      name: updates.name,
      starred: updates.starred,
      trashed: updates.trashed,
    },
    addParents: updates.addParents,
    removeParents: updates.removeParents,
    fields:
      "id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, webContentLink, starred, trashed",
  });

  const file = response.data;
  return {
    id: file.id || "",
    name: file.name || "",
    mimeType: file.mimeType || "",
    size: file.size ?? undefined,
    createdTime: file.createdTime ?? undefined,
    modifiedTime: file.modifiedTime ?? undefined,
    parents: file.parents ?? undefined,
    webViewLink: file.webViewLink ?? undefined,
    webContentLink: file.webContentLink ?? undefined,
    starred: file.starred ?? undefined,
    trashed: file.trashed ?? undefined,
  };
}

export async function deleteFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const drive = getDriveClient(accessToken);
  await drive.files.delete({ fileId });
}

export async function moveToTrash(
  accessToken: string,
  fileId: string
): Promise<DriveFile> {
  return updateFile(accessToken, fileId, { trashed: true });
}

export async function downloadFile(
  accessToken: string,
  fileId: string
): Promise<Buffer> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

export async function getStorageQuota(accessToken: string): Promise<{
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}> {
  const drive = getDriveClient(accessToken);

  const response = await drive.about.get({
    fields: "storageQuota",
  });

  const quota = response.data.storageQuota;
  return {
    limit: quota?.limit ?? undefined,
    usage: quota?.usage ?? undefined,
    usageInDrive: quota?.usageInDrive ?? undefined,
    usageInDriveTrash: quota?.usageInDriveTrash ?? undefined,
  };
}

export async function listSharedWithMe(
  accessToken: string,
  options: {
    pageToken?: string;
    pageSize?: number;
  } = {}
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.list({
    q: "sharedWithMe = true and trashed = false",
    pageToken: options.pageToken,
    pageSize: options.pageSize || 50,
    orderBy: "modifiedTime desc",
    fields:
      "nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, starred, shared, owners)",
  });

  const files = (response.data.files || []).map((file) => ({
    id: file.id || "",
    name: file.name || "",
    mimeType: file.mimeType || "",
    size: file.size ?? undefined,
    createdTime: file.createdTime ?? undefined,
    modifiedTime: file.modifiedTime ?? undefined,
    webViewLink: file.webViewLink ?? undefined,
    webContentLink: file.webContentLink ?? undefined,
    iconLink: file.iconLink ?? undefined,
    thumbnailLink: file.thumbnailLink ?? undefined,
    starred: file.starred ?? undefined,
    shared: file.shared ?? undefined,
    owners: file.owners?.map((o) => ({
      displayName: o.displayName ?? undefined,
      emailAddress: o.emailAddress ?? undefined,
      photoLink: o.photoLink ?? undefined,
    })),
  }));

  return {
    files,
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}

export async function listStarred(
  accessToken: string,
  options: {
    pageToken?: string;
    pageSize?: number;
  } = {}
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.list({
    q: "starred = true and trashed = false",
    pageToken: options.pageToken,
    pageSize: options.pageSize || 50,
    orderBy: "modifiedTime desc",
    fields:
      "nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, webContentLink, iconLink, thumbnailLink, starred, trashed, shared)",
  });

  const files = (response.data.files || []).map((file) => ({
    id: file.id || "",
    name: file.name || "",
    mimeType: file.mimeType || "",
    size: file.size ?? undefined,
    createdTime: file.createdTime ?? undefined,
    modifiedTime: file.modifiedTime ?? undefined,
    parents: file.parents ?? undefined,
    webViewLink: file.webViewLink ?? undefined,
    webContentLink: file.webContentLink ?? undefined,
    iconLink: file.iconLink ?? undefined,
    thumbnailLink: file.thumbnailLink ?? undefined,
    starred: file.starred ?? undefined,
    trashed: file.trashed ?? undefined,
    shared: file.shared ?? undefined,
  }));

  return {
    files,
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}
