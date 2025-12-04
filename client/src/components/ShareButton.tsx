"use client";

import { useState } from "react";
import { Share2, Lock, Eye, Edit3, Link as LinkIcon, Check } from "lucide-react";

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
  const [copied, setCopied] = useState(false);

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
        // Reload page to get new JWT with updated permissions
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to update access:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/documents/${documentId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAccessIcon = () => {
    switch (access) {
      case "PRIVATE":
        return <Lock className="h-4 w-4" />;
      case "READ":
        return <Eye className="h-4 w-4" />;
      case "WRITE":
        return <Edit3 className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  const getAccessLabel = () => {
    switch (access) {
      case "PRIVATE":
        return "Private";
      case "READ":
        return "View Only";
      case "WRITE":
        return "Can Edit";
      default:
        return "Share";
    }
  };

  if (!isOwner && access === "PRIVATE") return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {isOwner && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0F1419] border border-gray-800 rounded-xl hover:bg-[#1A1F2E] transition-all shadow-sm"
          >
            {getAccessIcon()}
            <span className="hidden sm:inline">{getAccessLabel()}</span>
          </button>
        )}
        
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Copy Link</span>
            </>
          )}
        </button>
      </div>

      {isOpen && isOwner && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 z-20 bg-[#1A1F2E] rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
            <div className="p-2">
              <button
                onClick={() => updateAccess("PRIVATE")}
                disabled={isLoading}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  access === "PRIVATE"
                    ? "bg-violet-500/20 border border-violet-500/50"
                    : "hover:bg-[#0F1419] border border-transparent"
                } disabled:opacity-50`}
              >
                <Lock className="h-5 w-5 mt-0.5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">
                    Private
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Only you can access
                  </div>
                </div>
                {access === "PRIVATE" && (
                  <Check className="h-5 w-5 text-violet-400" />
                )}
              </button>
              
              <button
                onClick={() => updateAccess("READ")}
                disabled={isLoading}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  access === "READ"
                    ? "bg-violet-500/20 border border-violet-500/50"
                    : "hover:bg-[#0F1419] border border-transparent"
                } disabled:opacity-50`}
              >
                <Eye className="h-5 w-5 mt-0.5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">
                    View Only
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Anyone with link can view
                  </div>
                </div>
                {access === "READ" && (
                  <Check className="h-5 w-5 text-violet-400" />
                )}
              </button>
              
              <button
                onClick={() => updateAccess("WRITE")}
                disabled={isLoading}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  access === "WRITE"
                    ? "bg-violet-500/20 border border-violet-500/50"
                    : "hover:bg-[#0F1419] border border-transparent"
                } disabled:opacity-50`}
              >
                <Edit3 className="h-5 w-5 mt-0.5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">
                    Can Edit
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Anyone with link can edit
                  </div>
                </div>
                {access === "WRITE" && (
                  <Check className="h-5 w-5 text-violet-400" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
