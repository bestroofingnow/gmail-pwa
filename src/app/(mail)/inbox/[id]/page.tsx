"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMessage } from "@/lib/hooks";
import { EmailDetail } from "@/components/EmailDetail";
import { ComposeModal } from "@/components/ComposeModal";
import { parseEmailAddress } from "@/lib/utils";

export default function EmailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { message, isLoading, error } = useMessage(id);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState<"reply" | "forward" | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Email not found</p>
          <Link href="/inbox" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to inbox
          </Link>
        </div>
      </div>
    );
  }

  const handleReply = () => {
    setComposeMode("reply");
    setShowCompose(true);
  };

  const handleForward = () => {
    setComposeMode("forward");
    setShowCompose(true);
  };

  const sender = parseEmailAddress(message.from);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <button
          onClick={() => router.push("/inbox")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to inbox
        </button>
      </div>

      <EmailDetail
        email={message}
        onReply={handleReply}
        onForward={handleForward}
      />

      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ComposeModal
            defaultTo={composeMode === "reply" ? sender.email : ""}
            defaultSubject={message.subject}
            defaultBody={
              composeMode === "reply"
                ? `\n\n\n---------- Original Message ----------\nFrom: ${message.from}\nDate: ${message.date}\nSubject: ${message.subject}\n\n${message.body}`
                : composeMode === "forward"
                ? `\n\n\n---------- Forwarded Message ----------\nFrom: ${message.from}\nDate: ${message.date}\nSubject: ${message.subject}\nTo: ${message.to}\n\n${message.body}`
                : ""
            }
            threadId={composeMode === "reply" ? message.threadId : undefined}
            isReply={composeMode === "reply"}
            isForward={composeMode === "forward"}
            onClose={() => {
              setShowCompose(false);
              setComposeMode(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
