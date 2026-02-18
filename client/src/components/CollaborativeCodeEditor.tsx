"use client";

import { useState, useEffect, useRef } from "react";
import { Editor, OnMount } from "@monaco-editor/react";
import { Play, Terminal, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { MonacoBinding } from "y-monaco";
import { IndexeddbPersistence } from "y-indexeddb";

interface CollaborativeCodeEditorProps {
  documentId: string;
  readOnly?: boolean;
  token: string;
}

const COLORS = [
  "#958DF1",
  "#F98181",
  "#FBBC88",
  "#FAF594",
  "#70CFF8",
  "#94FADB",
  "#B9F18D",
];

export default function CollaborativeCodeEditor({
  documentId,
  readOnly = false,
  token,
}: CollaborativeCodeEditorProps) {
  // Auth removed: session logic deleted
  const [output, setOutput] = useState<string | null>(null);
  const [input, setInput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [language, setLanguage] = useState("javascript");
  const [status, setStatus] = useState("connecting");
  
  const editorRef = useRef<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const DEFAULT_SNIPPETS: Record<string, string> = {
    javascript: "// Start coding...\nconsole.log('Hello World');",
    typescript: "// Start coding...\nconsole.log('Hello World');",
    python: "# Start coding...\nprint('Hello World')",
    java: "// Start coding...\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}",
    c: "// Start coding...\n#include <stdio.h>\n\nint main() {\n    printf(\"Hello World\\n\");\n    return 0;\n}",
    cpp: "// Start coding...\n#include <iostream>\n\nint main() {\n    std::cout << \"Hello World\" << std::endl;\n    return 0;\n}",
    go: "// Start coding...\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello World\")\n}",
    rust: "// Start coding...\nfn main() {\n    println!(\"Hello World\");\n}",
  };

  // Initialize Yjs and Hocuspocus
  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";
    const provider = new HocuspocusProvider({
      url: `${wsUrl}?token=${token}`,
      name: documentId,
      document: ydoc,
      onStatus: (event: { status: string }) => {
        setStatus(event.status);
      },
    } as any);
    providerRef.current = provider;

    // Set up IndexedDB persistence for offline support
    const indexeddbProvider = new IndexeddbPersistence(documentId, ydoc);

    return () => {
      bindingRef.current?.destroy();
      provider.destroy();
      indexeddbProvider.destroy();
      ydoc.destroy();
    };
  }, [documentId, token]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    if (ydocRef.current && providerRef.current) {
      const ytext = ydocRef.current.getText("monaco");

      // Create Monaco binding for Yjs
      const binding = new MonacoBinding(
        ytext,
        editor.getModel()!,
        new Set([editor]),
        providerRef.current.awareness
      );
      bindingRef.current = binding;

      // Set user awareness to Anonymous
      providerRef.current.awareness?.setLocalStateField("user", {
        name: "Anonymous",
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (editorRef.current && !readOnly) {
      const model = editorRef.current.getModel();
      if (model) {
        model.setValue(DEFAULT_SNIPPETS[newLanguage] || "");
      }
    }
  };

  const handleRun = async () => {
    if (!editorRef.current) return;
    
    setIsRunning(true);
    setIsTerminalOpen(true);
    setOutput("Running...");

    const code = editorRef.current.getValue();

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          stdin: input,
        }),
      });

      const data = await response.json();

      if (data.run) {
        let result = "";
        if (data.run.stdout) result += data.run.stdout;
        if (data.run.stderr) result += `\nError:\n${data.run.stderr}`;
        if (!result) result = "No output";
        setOutput(result);
      } else if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput("Unknown execution error");
      }
    } catch (error) {
      setOutput(`Failed to execute code: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#1e1e1e] flex flex-col relative overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-[#3e3e3e] text-white text-sm rounded px-2 py-1 border border-[#52525b] focus:outline-none focus:border-[#f472b6]"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#1e1e1e] rounded-full border border-[#3e3e3e]">
            <div className="relative">
              <div
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                  status === "connected"
                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                    : "bg-yellow-500"
                }`}
              />
              {status === "connected" && (
                <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-green-500 animate-ping opacity-75" />
              )}
            </div>
            <span className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider">
              {status === "connected" ? "Synced" : "Syncing"}
            </span>
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning || readOnly}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-medium transition-all ${
              isRunning
                ? "bg-[#f472b6]/50 cursor-wait text-white/70"
                : "bg-[#f472b6] hover:bg-[#ec4899] text-white shadow-[0_0_10px_rgba(244,114,182,0.3)]"
            }`}
          >
            <Play size={14} className={isRunning ? "animate-spin" : "fill-current"} />
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative min-h-0">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={language}
          defaultValue="// Start coding..."
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            readOnly,
            minimap: { enabled: true },
            fontSize: 14,
            padding: { top: 20 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            automaticLayout: true,
          }}
        />
      </div>

      {/* Terminal Panel */}
      <div
        className={`bg-[#1e1e1e] border-t border-[#3e3e3e] flex flex-col transition-all duration-300 ease-in-out ${
          isTerminalOpen ? "h-[35%]" : "h-10"
        }`}
      >
        {/* Terminal Header */}
        <div
          className="flex items-center justify-between px-4 py-2 bg-[#252526] cursor-pointer hover:bg-[#2a2a2b]"
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
        >
          <div className="flex items-center gap-2 text-zinc-400">
            <Terminal size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">
              Terminal
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(output || input) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOutput(null);
                  setInput("");
                }}
                className="p-1 hover:bg-[#3e3e3e] rounded text-zinc-500 hover:text-zinc-300"
                title="Clear Console"
              >
                <Trash2 size={12} />
              </button>
            )}
            {isTerminalOpen ? (
              <ChevronDown size={14} className="text-zinc-500" />
            ) : (
              <ChevronUp size={14} className="text-zinc-500" />
            )}
          </div>
        </div>

        {/* Terminal Content - Input & Output Sections */}
        {isTerminalOpen && (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Input Section */}
            <div className="w-1/2 flex flex-col border-r border-[#3e3e3e]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-[#3e3e3e]">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Input (stdin)
                </span>
                {input && (
                  <button
                    onClick={() => setInput("")}
                    className="p-0.5 hover:bg-[#3e3e3e] rounded text-zinc-600 hover:text-zinc-400"
                    title="Clear Input"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input for your program..."
                className="flex-1 w-full p-3 bg-transparent text-zinc-300 font-mono text-sm resize-none focus:outline-none placeholder:text-zinc-600"
                disabled={readOnly}
              />
            </div>

            {/* Output Section */}
            <div className="w-1/2 flex flex-col">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-[#3e3e3e]">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Output
                </span>
                {output && (
                  <button
                    onClick={() => setOutput(null)}
                    className="p-0.5 hover:bg-[#3e3e3e] rounded text-zinc-600 hover:text-zinc-400"
                    title="Clear Output"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-auto p-3 font-mono text-sm">
                {output ? (
                  <pre className="whitespace-pre-wrap text-zinc-300">{output}</pre>
                ) : (
                  <div className="text-zinc-600 italic">
                    Click "Run" to execute your code...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
