"use client";

import { useMessages } from "@/lib/hooks";
import { EmailList } from "@/components/EmailList";

export default function InboxPage() {
  const { messages, isLoading, isLoadingMore, hasMore, loadMore } = useMessages(["INBOX"]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">Inbox</h1>
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
