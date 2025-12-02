"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>;
  }

  if (status === "authenticated" && session?.user) {
    return (
      <div className="flex items-center gap-4">
        <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-200 md:block">
          {session.user.name}
        </span>
        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-700"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      Sign in
    </button>
  );
}
