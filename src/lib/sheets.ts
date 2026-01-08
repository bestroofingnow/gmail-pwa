import { google } from "googleapis";

export interface Spreadsheet {
  id: string;
  title: string;
  locale?: string;
  timeZone?: string;
  sheets?: SheetProperties[];
  webViewLink?: string;
}

export interface SheetProperties {
  sheetId: number;
  title: string;
  index: number;
  gridProperties?: {
    rowCount: number;
    columnCount: number;
  };
}

export interface CellValue {
  value: string | number | boolean | null;
  formattedValue?: string;
}

export interface SheetData {
  range: string;
  values: (string | number | boolean | null)[][];
}

function getSheetsClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth });
}

function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

export async function listSpreadsheets(
  accessToken: string,
  options: {
    pageToken?: string;
    pageSize?: number;
  } = {}
): Promise<{ spreadsheets: { id: string; name: string; modifiedTime?: string }[]; nextPageToken?: string }> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
    pageToken: options.pageToken,
    pageSize: options.pageSize || 50,
    orderBy: "modifiedTime desc",
    fields: "nextPageToken, files(id, name, modifiedTime)",
  });

  const spreadsheets = (response.data.files || []).map((file) => ({
    id: file.id || "",
    name: file.name || "",
    modifiedTime: file.modifiedTime ?? undefined,
  }));

  return {
    spreadsheets,
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}

export async function getSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Spreadsheet> {
  const sheets = getSheetsClient(accessToken);

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  const data = response.data;
  return {
    id: data.spreadsheetId || "",
    title: data.properties?.title || "",
    locale: data.properties?.locale ?? undefined,
    timeZone: data.properties?.timeZone ?? undefined,
    sheets: data.sheets?.map((sheet) => ({
      sheetId: sheet.properties?.sheetId || 0,
      title: sheet.properties?.title || "",
      index: sheet.properties?.index || 0,
      gridProperties: sheet.properties?.gridProperties
        ? {
            rowCount: sheet.properties.gridProperties.rowCount || 0,
            columnCount: sheet.properties.gridProperties.columnCount || 0,
          }
        : undefined,
    })),
    webViewLink: data.spreadsheetUrl ?? undefined,
  };
}

export async function createSpreadsheet(
  accessToken: string,
  title: string,
  sheetTitles?: string[]
): Promise<Spreadsheet> {
  const sheets = getSheetsClient(accessToken);

  const requestBody: { properties: { title: string }; sheets?: { properties: { title: string } }[] } = {
    properties: { title },
  };

  if (sheetTitles && sheetTitles.length > 0) {
    requestBody.sheets = sheetTitles.map((sheetTitle) => ({
      properties: { title: sheetTitle },
    }));
  }

  const response = await sheets.spreadsheets.create({
    requestBody,
  });

  const data = response.data;
  return {
    id: data.spreadsheetId || "",
    title: data.properties?.title || "",
    sheets: data.sheets?.map((sheet) => ({
      sheetId: sheet.properties?.sheetId || 0,
      title: sheet.properties?.title || "",
      index: sheet.properties?.index || 0,
      gridProperties: sheet.properties?.gridProperties
        ? {
            rowCount: sheet.properties.gridProperties.rowCount || 0,
            columnCount: sheet.properties.gridProperties.columnCount || 0,
          }
        : undefined,
    })),
    webViewLink: data.spreadsheetUrl ?? undefined,
  };
}

export async function getSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<SheetData> {
  const sheets = getSheetsClient(accessToken);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return {
    range: response.data.range || range,
    values: (response.data.values || []) as (string | number | boolean | null)[][],
  };
}

export async function updateSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean | null)[][],
  inputOption: "RAW" | "USER_ENTERED" = "USER_ENTERED"
): Promise<{ updatedRange: string; updatedRows: number; updatedColumns: number }> {
  const sheets = getSheetsClient(accessToken);

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: inputOption,
    requestBody: { values },
  });

  return {
    updatedRange: response.data.updatedRange || "",
    updatedRows: response.data.updatedRows || 0,
    updatedColumns: response.data.updatedColumns || 0,
  };
}

export async function appendSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean | null)[][],
  inputOption: "RAW" | "USER_ENTERED" = "USER_ENTERED"
): Promise<{ updatedRange: string; updatedRows: number }> {
  const sheets = getSheetsClient(accessToken);

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: inputOption,
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  return {
    updatedRange: response.data.updates?.updatedRange || "",
    updatedRows: response.data.updates?.updatedRows || 0,
  };
}

export async function clearSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<{ clearedRange: string }> {
  const sheets = getSheetsClient(accessToken);

  const response = await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range,
  });

  return {
    clearedRange: response.data.clearedRange || "",
  };
}

export async function addSheet(
  accessToken: string,
  spreadsheetId: string,
  title: string
): Promise<SheetProperties> {
  const sheets = getSheetsClient(accessToken);

  const response = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: { title },
          },
        },
      ],
    },
  });

  const reply = response.data.replies?.[0]?.addSheet;
  return {
    sheetId: reply?.properties?.sheetId || 0,
    title: reply?.properties?.title || title,
    index: reply?.properties?.index || 0,
    gridProperties: reply?.properties?.gridProperties
      ? {
          rowCount: reply.properties.gridProperties.rowCount || 0,
          columnCount: reply.properties.gridProperties.columnCount || 0,
        }
      : undefined,
  };
}

export async function deleteSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number
): Promise<void> {
  const sheets = getSheetsClient(accessToken);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteSheet: { sheetId },
        },
      ],
    },
  });
}

export async function renameSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  newTitle: string
): Promise<void> {
  const sheets = getSheetsClient(accessToken);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId,
              title: newTitle,
            },
            fields: "title",
          },
        },
      ],
    },
  });
}
