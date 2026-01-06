import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { EmailsResponse, EmailMessage, Label } from "@/types/gmail";

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
