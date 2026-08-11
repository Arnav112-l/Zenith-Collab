"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Code, 
  FileText, 
  Layout, 
  PieChart, 
  DollarSign, 
  Trello, 
  Calendar, 
  Clock, 
  Target, 
  Folder, 
  Bot,
  X 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Stagger, StaggerItem, fadeIn, scaleIn } from "@/components/motion";

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: string;
  onSubmit?: (data: { title: string; type: string }) => void;
}

const documentTypes = [
  { id: "TEXT", name: "Notes", icon: FileText, description: "Standard rich text editor" },
  { id: "CODE", name: "Coding", icon: Code, description: "Code editor with syntax highlighting" },
  { id: "CANVAS", name: "Canvas", icon: Layout, description: "Infinite whiteboard for diagrams" },
  { id: "BUDGET", name: "Budget", icon: PieChart, description: "Financial planning and charts" },
  { id: "EXPENSE", name: "Expense", icon: DollarSign, description: "Track daily expenses" },
  { id: "KANBAN", name: "Kanban", icon: Trello, description: "Project management board" },
  { id: "CALENDAR", name: "Calendar", icon: Calendar, description: "Schedule and events" },
  { id: "TIMETRACKER", name: "Time Tracker", icon: Clock, description: "Track time on tasks" },
  { id: "GOALS", name: "Goals", icon: Target, description: "Set and track goals" },
  { id: "FILES", name: "Files", icon: Folder, description: "File manager & storage" },
  { id: "AI", name: "AI Assistant", icon: Bot, description: "Chat with an AI helper" },
];

export default function CreateDocumentModal({ isOpen, onClose, initialType = "TEXT", onSubmit }: CreateDocumentModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState(initialType);
  const [isLoading, setIsLoading] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType);
      setTitle("");
    }
  }, [isOpen, initialType]);

  const handleCreate = async () => {
    if (!title.trim()) return;

    if (onSubmit) {
      onSubmit({ title, type: selectedType });
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type: selectedType }),
      });

      if (!response.ok) throw new Error("Failed to create document");

      const data = await response.json();
      router.push(`/documents/${data.id}`);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="create-document-modal"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={fadeIn}
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-4xl ui-panel rounded-xl overflow-hidden max-h-[90vh] flex flex-col"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={scaleIn}
          >
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Create New Notebook</h2>
              <button onClick={onClose} className="ui-btn-ghost">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <label className="block text-sm font-medium ui-muted mb-2">
                  Notebook Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notebook name..."
                  className="ui-input"
                  autoFocus
                />
              </div>

              <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentTypes.map((type) => (
                  <StaggerItem key={type.id}>
                    <button
                      onClick={() => setSelectedType(type.id)}
                      data-active={selectedType === type.id}
                      className="ui-menu-item flex-col items-start w-full p-4"
                    >
                      <div className={`p-2 rounded-lg inline-block mb-3 ${
                        selectedType === type.id
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--surface-2)] ui-muted"
                      }`}>
                        <type.icon size={24} />
                      </div>
                      <h3 className={`font-medium mb-1 ${
                        selectedType === type.id
                          ? "text-[var(--accent)]"
                          : "text-[var(--foreground)]"
                      }`}>
                        {type.name}
                      </h3>
                      <p className="text-sm ui-muted">{type.description}</p>
                    </button>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>

            <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={onClose}
                className="ui-btn"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleCreate}
                disabled={!title.trim() || isLoading}
                className="ui-btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {isLoading ? "Creating..." : "Create Notebook"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
