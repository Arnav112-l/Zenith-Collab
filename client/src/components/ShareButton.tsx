"use client";

import { useState } from "react";

interface ShareButtonProps {
  documentId: string;
  initialAccess: string;
  isOwner: boolean;
}

export default function ShareButton({
  documentId,
  initialAccess,
  isOwner,
}: ShareButtonProps) {
  const [access, setAccess] = useState(initialAccess);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const updateAccess = async (newAccess: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicAccess: newAccess }),
      });

      if (res.ok) {
        setAccess(newAccess);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Failed to update access:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/documents/${documentId}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  if (!isOwner && access === "PRIVATE") return null;

  return (
    <div className="relative inline-block text-left">
      <div className="flex gap-2">
        {isOwner && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
          >
            {access === "PRIVATE"
              ? "Private"
              : access === "READ"
              ? "Public (Read)"
              : "Public (Edit)"}
            <svg
              className="-mr-1 h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        
        <button
          onClick={copyLink}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Copy Link
        </button>
      </div>

      {isOpen && isOwner && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
          <div className="py-1">
            <button
              onClick={() => updateAccess("PRIVATE")}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Private (Only you)
            </button>
            <button
              onClick={() => updateAccess("READ")}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Public (Read-only)
            </button>
            <button
              onClick={() => updateAccess("WRITE")}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Public (Anyone can edit)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
