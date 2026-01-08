import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { EmailsResponse, EmailMessage, Label } from "@/types/gmail";
import { CalendarEvent, CalendarList } from "@/lib/calendar";
import { DriveFile } from "@/lib/drive";
import { Spreadsheet } from "@/lib/sheets";
import { Document } from "@/lib/docs";
import { Form } from "@/lib/forms";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMessages(labelIds?: string[], query?: string) {
  const getKey = (pageIndex: number, previousPageData: EmailsResponse | null) => {
    if (previousPageData && !previousPageData.nextPageToken) return null;

    const params = new URLSearchParams();
    params.set("maxResults", "20");

    if (previousPageData?.nextPageToken) {
      params.set("pageToken", previousPageData.nextPageToken);
    }

    if (labelIds?.length) {
      params.set("labelIds", labelIds.join(","));
    }

    if (query) {
      params.set("q", query);
    }

    return `/api/gmail/messages?${params.toString()}`;
  };

  const { data, error, size, setSize, isLoading, isValidating, mutate } =
    useSWRInfinite<EmailsResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
    });

  const messages = data ? data.flatMap((page) => page.messages) : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.messages?.length === 0;
  const hasMore = !!(data && data[data.length - 1]?.nextPageToken);

  return {
    messages,
    error,
    isLoading,
    isLoadingMore,
    isEmpty,
    hasMore,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}

export function useMessage(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<EmailMessage>(
    id ? `/api/gmail/message/${id}` : null,
    fetcher
  );

  return {
    message: data,
    error,
    isLoading,
    mutate,
  };
}

export function useLabels() {
  const { data, error, isLoading } = useSWR<Label[]>("/api/gmail/labels", fetcher);

  return {
    labels: data || [],
    error,
    isLoading,
  };
}

// Calendar Hooks
export function useCalendars() {
  const { data, error, isLoading, mutate } = useSWR<CalendarList[]>(
    "/api/calendar/list",
    fetcher
  );

  return {
    calendars: data || [],
    error,
    isLoading,
    mutate,
  };
}

export function useCalendarEvents(options?: {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
}) {
  const params = new URLSearchParams();
  if (options?.calendarId) params.set("calendarId", options.calendarId);
  if (options?.timeMin) params.set("timeMin", options.timeMin);
  if (options?.timeMax) params.set("timeMax", options.timeMax);

  const { data, error, isLoading, mutate } = useSWR<{
    events: CalendarEvent[];
    nextPageToken?: string;
  }>(`/api/calendar/events?${params.toString()}`, fetcher);

  return {
    events: data?.events || [],
    error,
    isLoading,
    mutate,
  };
}

// Drive Hooks
export function useDriveFiles(options?: {
  folderId?: string;
  query?: string;
  mimeType?: string;
}) {
  const params = new URLSearchParams();
  if (options?.folderId) params.set("folderId", options.folderId);
  if (options?.query) params.set("q", options.query);
  if (options?.mimeType) params.set("mimeType", options.mimeType);

  const { data, error, isLoading, mutate } = useSWR<{
    files: DriveFile[];
    nextPageToken?: string;
  }>(`/api/drive/files?${params.toString()}`, fetcher);

  return {
    files: data?.files || [],
    error,
    isLoading,
    mutate,
  };
}

export function useDriveFile(fileId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<DriveFile>(
    fileId ? `/api/drive/files/${fileId}` : null,
    fetcher
  );

  return {
    file: data,
    error,
    isLoading,
    mutate,
  };
}

export function useSharedFiles() {
  const { data, error, isLoading, mutate } = useSWR<{
    files: DriveFile[];
    nextPageToken?: string;
  }>("/api/drive/shared", fetcher);

  return {
    files: data?.files || [],
    error,
    isLoading,
    mutate,
  };
}

export function useStorageQuota() {
  const { data, error, isLoading } = useSWR<{
    limit?: string;
    usage?: string;
    usageInDrive?: string;
    usageInDriveTrash?: string;
  }>("/api/drive/quota", fetcher);

  return {
    quota: data,
    error,
    isLoading,
  };
}

// Sheets Hooks
export function useSpreadsheets() {
  const { data, error, isLoading, mutate } = useSWR<{
    spreadsheets: { id: string; name: string; modifiedTime?: string }[];
    nextPageToken?: string;
  }>("/api/sheets", fetcher);

  return {
    spreadsheets: data?.spreadsheets || [],
    error,
    isLoading,
    mutate,
  };
}

export function useSpreadsheet(spreadsheetId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Spreadsheet>(
    spreadsheetId ? `/api/sheets/${spreadsheetId}` : null,
    fetcher
  );

  return {
    spreadsheet: data,
    error,
    isLoading,
    mutate,
  };
}

// Docs Hooks
export function useDocuments() {
  const { data, error, isLoading, mutate } = useSWR<{
    documents: { id: string; name: string; modifiedTime?: string }[];
    nextPageToken?: string;
  }>("/api/docs", fetcher);

  return {
    documents: data?.documents || [],
    error,
    isLoading,
    mutate,
  };
}

export function useDocument(documentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Document>(
    documentId ? `/api/docs/${documentId}` : null,
    fetcher
  );

  return {
    document: data,
    error,
    isLoading,
    mutate,
  };
}

// Forms Hooks
export function useForms() {
  const { data, error, isLoading, mutate } = useSWR<{
    forms: { id: string; name: string; modifiedTime?: string }[];
    nextPageToken?: string;
  }>("/api/forms", fetcher);

  return {
    forms: data?.forms || [],
    error,
    isLoading,
    mutate,
  };
}

export function useForm(formId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Form>(
    formId ? `/api/forms/${formId}` : null,
    fetcher
  );

  return {
    form: data,
    error,
    isLoading,
    mutate,
  };
}

export function useFormResponses(formId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    responses: {
      responseId: string;
      createTime: string;
      answers: Record<string, { textAnswers?: { answers: { value: string }[] } }>;
    }[];
    nextPageToken?: string;
  }>(formId ? `/api/forms/${formId}?responses=true` : null, fetcher);

  return {
    responses: data?.responses || [],
    error,
    isLoading,
    mutate,
  };
}
