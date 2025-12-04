"use client";

import { useState } from "react";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Play, Terminal, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

interface CodeEditorProps {
  content: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ content, onChange, readOnly }: CodeEditorProps) {
  const { theme } = useTheme();
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [language, setLanguage] = useState("javascript");

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

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    onChange(DEFAULT_SNIPPETS[newLanguage] || "");
  };

  const handleRun = async () => {
    setIsRunning(true);
    setIsTerminalOpen(true);
    setOutput("Running...");

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code: content,
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

      {/* Editor Area */}
      <div className="flex-1 relative min-h-0">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={language}
          defaultValue="// Start coding..."
          value={content}
          onChange={onChange}
          theme="vs-dark"
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
          isTerminalOpen ? "h-[30%]" : "h-10"
        }`}
      >
        {/* Terminal Header */}
        <div 
          className="flex items-center justify-between px-4 py-2 bg-[#252526] cursor-pointer hover:bg-[#2a2a2b]"
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
        >
          <div className="flex items-center gap-2 text-zinc-400">
            <Terminal size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Console</span>
          </div>
          <div className="flex items-center gap-2">
            {output && (
              <button 
                onClick={(e) => { e.stopPropagation(); setOutput(null); }}
                className="p-1 hover:bg-[#3e3e3e] rounded text-zinc-500 hover:text-zinc-300"
                title="Clear Console"
              >
                <Trash2 size={12} />
              </button>
            )}
            {isTerminalOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronUp size={14} className="text-zinc-500" />}
          </div>
        </div>

        {/* Terminal Output */}
        {isTerminalOpen && (
          <div className="flex-1 overflow-auto p-4 font-mono text-sm">
            {output ? (
              <pre className="whitespace-pre-wrap text-zinc-300">{output}</pre>
            ) : (
              <div className="text-zinc-600 italic">
                Click "Run" to execute your code...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
