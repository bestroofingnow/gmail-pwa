"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmailMessage } from "@/types/gmail";
import { formatDate, parseEmailAddress } from "@/lib/utils";

interface EmailDetailProps {
  email: EmailMessage;
  onReply?: () => void;
  onForward?: () => void;
}

export function EmailDetail({ email, onReply, onForward }: EmailDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const sender = parseEmailAddress(email.from);

  const handleDelete = async () => {
    if (!confirm("Move this email to trash?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gmail/message/${email.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/inbox");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadAttachment = async (attachmentId: string, filename: string) => {
    try {
      const res = await fetch(`/api/gmail/attachments/${email.id}/${attachmentId}`);
      const data = await res.json();

      // Decode base64 and download
      const byteCharacters = atob(data.data.replace(/-/g, "+").replace(/_/g, "/"));
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download attachment:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <h1 className="text-xl font-semibold text-gray-900">{email.subject}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onReply}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Reply"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={onForward}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Forward"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 hover:bg-red-50 rounded-full transition-colors"
              title="Delete"
            >
              <svg className="w-5 h-5 text-gray-600 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0">
            {sender.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{sender.name}</span>
              <span className="text-sm text-gray-500">&lt;{sender.email}&gt;</span>
            </div>
            <div className="text-sm text-gray-500">
              to {email.to}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {formatDate(email.date)}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {email.bodyHtml ? (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-gray-700">
            {email.body}
          </pre>
        )}
      </div>

      {/* Attachments */}
      {email.attachments.length > 0 && (
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Attachments ({email.attachments.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {email.attachments.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => downloadAttachment(attachment.id, attachment.filename)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="truncate max-w-[200px]">{attachment.filename}</span>
                <span className="text-gray-400 text-xs">
                  ({Math.round(attachment.size / 1024)}KB)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
