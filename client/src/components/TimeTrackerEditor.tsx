"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Clock, Trash2 } from "lucide-react";

interface TimeTrackerEditorProps {
  content: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

interface TimeEntry {
  id: string;
  description: string;
  startTime: number;
  endTime?: number;
  duration: number; // in seconds
}

export default function TimeTrackerEditor({ content, onChange, readOnly }: TimeTrackerEditorProps) {
  const [entries, setEntries] = useState<TimeEntry[]>(() => {
    try {
      const parsed = content ? JSON.parse(content) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeEntry) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        setElapsed(Math.floor((now - activeEntry.startTime) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeEntry]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (!description.trim()) return;
    
    const newEntry: TimeEntry = {
      id: crypto.randomUUID(),
      description,
      startTime: Date.now(),
      duration: 0,
    };
    
    setActiveEntry(newEntry);
    setElapsed(0);
  };

  const stopTimer = () => {
    if (!activeEntry) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - activeEntry.startTime) / 1000);
    
    const completedEntry: TimeEntry = {
      ...activeEntry,
      endTime,
      duration,
    };

    const updatedEntries = [completedEntry, ...entries];
    setEntries(updatedEntries);
    setActiveEntry(null);
    setDescription("");
    setElapsed(0);
    onChange(JSON.stringify(updatedEntries));
  };

  const deleteEntry = (id: string) => {
    const updatedEntries = entries.filter(e => e.id !== id);
    setEntries(updatedEntries);
    onChange(JSON.stringify(updatedEntries));
  };

  const totalTime = entries.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="h-full w-full bg-[#0a0a0a] p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Timer Control */}
        {!readOnly && (
          <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a] shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="What are you working on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!!activeEntry}
                  className="w-full bg-[#27272a] text-white text-lg rounded-xl px-4 py-3 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6] placeholder:text-[#52525b]"
                />
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                <div className="text-3xl font-mono font-bold text-white tabular-nums">
                  {formatTime(elapsed)}
                </div>
                {activeEntry ? (
                  <button
                    onClick={stopTimer}
                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    <Square fill="currentColor" size={20} />
                  </button>
                ) : (
                  <button
                    onClick={startTimer}
                    disabled={!description.trim()}
                    className="bg-[#f472b6] hover:bg-[#ec4899] disabled:opacity-50 disabled:hover:bg-[#f472b6] text-white p-3 rounded-xl transition-colors shadow-[0_0_15px_rgba(244,114,182,0.3)]"
                  >
                    <Play fill="currentColor" size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#a1a1aa] font-medium">Total Time</h3>
              <Clock className="w-5 h-5 text-[#f472b6]" />
            </div>
            <p className="text-2xl font-bold text-white">{formatTime(totalTime)}</p>
          </div>
          <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#a1a1aa] font-medium">Entries</h3>
              <div className="text-[#f472b6] font-bold">{entries.length}</div>
            </div>
            <p className="text-sm text-[#a1a1aa]">Total recorded sessions</p>
          </div>
          <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#a1a1aa] font-medium">Average Session</h3>
              <div className="text-[#f472b6] font-bold">
                {entries.length > 0 ? formatTime(Math.round(totalTime / entries.length)) : "00:00:00"}
              </div>
            </div>
            <p className="text-sm text-[#a1a1aa]">Time per session</p>
          </div>
        </div>

        {/* History */}
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] overflow-hidden">
          <div className="p-6 border-b border-[#27272a]">
            <h3 className="text-white font-semibold">History</h3>
          </div>
          <div className="divide-y divide-[#27272a]">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-[#27272a]/50 transition-colors group">
                <div>
                  <p className="text-white font-medium">{entry.description}</p>
                  <p className="text-xs text-[#a1a1aa]">
                    {new Date(entry.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-white font-medium">
                    {formatTime(entry.duration)}
                  </span>
                  {!readOnly && (
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-[#a1a1aa] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="p-8 text-center text-[#a1a1aa]">
                No time entries yet. Start tracking!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
