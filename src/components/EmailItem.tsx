"use client";

import Link from "next/link";
import { EmailListItem } from "@/types/gmail";
import { formatDate, parseEmailAddress, cn } from "@/lib/utils";

interface EmailItemProps {
  email: EmailListItem;
  selected?: boolean;
}

export function EmailItem({ email, selected }: EmailItemProps) {
  const sender = parseEmailAddress(email.from);

  return (
    <Link
      href={`/inbox/${email.id}`}
      className={cn(
        "flex items-center gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
        selected && "bg-blue-50",
        email.isUnread && "bg-white"
      )}
    >
      <div className="flex-shrink-0">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
          email.isUnread ? "bg-blue-500" : "bg-gray-400"
        )}>
          {sender.name.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "text-sm truncate",
            email.isUnread ? "font-semibold text-gray-900" : "text-gray-700"
          )}>
            {sender.name}
          </span>
          <span className={cn(
            "text-xs flex-shrink-0",
            email.isUnread ? "font-semibold text-gray-900" : "text-gray-500"
          )}>
            {formatDate(email.date)}
          </span>
        </div>

        <div className={cn(
          "text-sm truncate",
          email.isUnread ? "font-semibold text-gray-900" : "text-gray-700"
        )}>
          {email.subject}
        </div>

        <div className="text-sm text-gray-900 truncate">
          {email.snippet}
        </div>
      </div>

      {email.hasAttachments && (
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      )}
    </Link>
  );
}
