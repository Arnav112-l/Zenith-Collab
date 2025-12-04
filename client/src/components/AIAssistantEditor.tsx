'use client'

import { useState } from 'react'
import { Send, Bot, User } from 'lucide-react'

interface AIAssistantEditorProps {
  content: string
  onChange: (value: string) => void
  readOnly?: boolean
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AIAssistantEditor({ content, onChange, readOnly }: AIAssistantEditorProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      return content ? JSON.parse(content) : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const newMessages = [
      ...messages,
      { role: 'user' as const, content: input }
    ]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage = {
        role: 'assistant' as const,
        content: "I'm a simulated AI assistant. I can help you with your tasks, answer questions, or generate content. How can I assist you today?"
      }
      const updatedMessages = [...newMessages, assistantMessage]
      setMessages(updatedMessages)
      onChange(JSON.stringify(updatedMessages))
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <Bot className="w-12 h-12 mb-4 opacity-50" />
            <p>Start a conversation with the AI Assistant</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 text-blue-100'
                  : 'bg-zinc-800 text-zinc-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-zinc-800 rounded-2xl px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-75" />
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="p-4 border-t border-[#27272a] bg-[#0a0a0a]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



