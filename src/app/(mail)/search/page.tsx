"use client";

import { useSearchParams } from "next/navigation";
import { useMessages } from "@/lib/hooks";
import { EmailList } from "@/components/EmailList";
import { Suspense } from "react";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const { messages, isLoading, isLoadingMore, hasMore, loadMore } = useMessages(
    undefined,
    query
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">
            Search results for &quot;{query}&quot;
          </h1>
        </div>
        <EmailList
          emails={messages}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
