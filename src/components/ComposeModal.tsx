"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ComposeModalProps {
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
  onClose?: () => void;
  isReply?: boolean;
  isForward?: boolean;
}

export function ComposeModal({
  defaultTo = "",
  defaultSubject = "",
  defaultBody = "",
  threadId,
  inReplyTo,
  references,
  onClose,
  isReply,
  isForward,
}: ComposeModalProps) {
  const router = useRouter();
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(
    isReply ? `Re: ${defaultSubject.replace(/^Re:\s*/i, "")}` :
    isForward ? `Fwd: ${defaultSubject.replace(/^Fwd:\s*/i, "")}` :
    defaultSubject
  );
  const [body, setBody] = useState(defaultBody);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!to.trim()) {
      setError("Please enter a recipient");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject,
          body: body.replace(/\n/g, "<br>"),
          threadId,
          inReplyTo,
          references,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send email");
      }

      if (onClose) {
        onClose();
      } else {
        router.push("/inbox");
      }
      router.refresh();
    } catch (err) {
      setError("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="font-medium text-gray-900">
          {isReply ? "Reply" : isForward ? "Forward" : "New Message"}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-gray-200">
            <div className="flex items-center px-4 py-2">
              <label className="w-16 text-sm text-gray-500">To</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 outline-none text-sm"
                placeholder="recipient@example.com"
                required
              />
              <div className="flex gap-2 text-sm text-blue-600">
                {!showCc && (
                  <button type="button" onClick={() => setShowCc(true)}>Cc</button>
                )}
                {!showBcc && (
                  <button type="button" onClick={() => setShowBcc(true)}>Bcc</button>
                )}
              </div>
            </div>

            {showCc && (
              <div className="flex items-center px-4 py-2 border-t border-gray-100">
                <label className="w-16 text-sm text-gray-500">Cc</label>
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="flex-1 outline-none text-sm"
                  placeholder="cc@example.com"
                />
              </div>
            )}

            {showBcc && (
              <div className="flex items-center px-4 py-2 border-t border-gray-100">
                <label className="w-16 text-sm text-gray-500">Bcc</label>
                <input
                  type="email"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  className="flex-1 outline-none text-sm"
                  placeholder="bcc@example.com"
                />
              </div>
            )}

            <div className="flex items-center px-4 py-2 border-t border-gray-100">
              <label className="w-16 text-sm text-gray-500">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 outline-none text-sm"
                placeholder="Subject"
                required
              />
            </div>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full p-4 outline-none resize-none text-sm min-h-[300px]"
            placeholder="Write your message..."
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {error && (
            <div className="text-red-600 text-sm mb-2">{error}</div>
          )}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full font-medium transition-colors"
            >
              {isSending ? "Sending..." : "Send"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title="Discard"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
