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

  if (!isOpen || !mounted) return null;

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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-[#27272a] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Create New Notebook</h2>
          <button onClick={onClose} className="text-[#a1a1aa] hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
              Notebook Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notebook name..."
              className="w-full px-4 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-white focus:outline-none focus:border-[#f472b6] transition-colors"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedType === type.id
                    ? "bg-[#f472b6]/10 border-[#f472b6] ring-1 ring-[#f472b6]"
                    : "bg-[#27272a]/50 border-[#3f3f46] hover:bg-[#27272a] hover:border-[#52525b]"
                }`}
              >
                <div className={`p-2 rounded-lg inline-block mb-3 ${
                  selectedType === type.id ? "bg-[#f472b6] text-white" : "bg-[#27272a] text-[#a1a1aa]"
                }`}>
                  <type.icon size={24} />
                </div>
                <h3 className={`font-medium mb-1 ${
                  selectedType === type.id ? "text-white" : "text-[#e4e4e7]"
                }`}>
                  {type.name}
                </h3>
                <p className="text-sm text-[#a1a1aa]">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-[#27272a] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#e4e4e7] hover:bg-[#27272a] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || isLoading}
            className="px-6 py-2 bg-[#f472b6] text-white font-medium rounded-lg hover:bg-[#ec4899] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Creating..." : "Create Notebook"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
