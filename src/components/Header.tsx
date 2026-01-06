"use client";

import { useSession, signOut } from "next-auth/react";
import { SearchBar } from "./SearchBar";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
      <div className="flex items-center gap-2">
        <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
        <span className="text-xl font-semibold text-gray-800">Mail</span>
      </div>

      <SearchBar />

      {session?.user && (
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm text-gray-600 hidden sm:inline">
            {session.user.email}
          </span>
          {session.user.image && (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-8 h-8 rounded-full"
            />
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 hover:bg-gray-100 rounded transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
