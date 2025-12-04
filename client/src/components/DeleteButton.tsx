"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import ConfirmationModal from "./ConfirmationModal";

interface DeleteButtonProps {
  documentId: string;
  isOwner: boolean;
}

export default function DeleteButton({ documentId, isOwner }: DeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  if (!isOwner) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Fetch available documents before deleting
      const docsRes = await fetch('/api/documents/list');
      const allDocs = docsRes.ok ? await docsRes.json() : [];
      
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Find next available document (excluding the one being deleted)
        const remainingDocs = allDocs.filter((d: { id: string }) => d.id !== documentId);
        
        if (remainingDocs.length > 0) {
          // Navigate to the first available document
          router.push(`/documents/${remainingDocs[0].id}`);
        } else {
          // No documents left, create a new one
          const createRes = await fetch('/api/documents', {
            method: 'POST',
          });
          if (createRes.ok) {
            const newDoc = await createRes.json();
            router.push(`/documents/${newDoc.id}`);
          } else {
            // Fallback to home if creation fails
            router.push('/');
          }
        }
      } else {
        alert('Failed to delete document');
        setIsDeleting(false);
        setShowConfirm(false);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-gray-800 hover:border-red-500/50"
        title="Delete document"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => !isDeleting && setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Document?"
        message="This action cannot be undone. This will permanently delete the document and remove all its content."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        isDangerous={true}
      />
    </>
  );
}
