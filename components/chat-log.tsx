"use client"

import { createContext, useContext, type ReactNode } from "react"

interface ChatLogContextValue {
  source?: string
  embedded?: boolean
}

const ChatLogContext = createContext<ChatLogContextValue>({})
export const useChatLog = () => useContext(ChatLogContext)

interface ChatLogProps {
  source?: string    // "claude_code" | "codex" | "gemini" etc.
  date?: string      // ISO date or display date
  title?: string     // conversation title
  embedded?: boolean // true = card mode, false = full-width
  children: ReactNode
}

const sourceLabels: Record<string, string> = {
  claude_code: "Claude Code",
  claude: "Claude",
  codex: "Codex",
  gemini: "Gemini",
  chatgpt: "ChatGPT",
}

function SourceLabel({ source }: { source: string }) {
  const label = sourceLabels[source] || source
  return (
    <span className="chat-log-source inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
      <span className="chat-log-source-dot" aria-hidden="true" />
      {label}
    </span>
  )
}

export default function ChatLog({ source, date, title, embedded = false, children }: ChatLogProps) {
  const hasHeader = source || date || title

  return (
    <ChatLogContext.Provider value={{ source, embedded }}>
      <div className={`chat-log ${embedded ? "chat-log-embedded" : ""}`}>
        {hasHeader && (
          <div className="chat-log-header">
            <div className="flex items-center gap-3 flex-wrap">
              {source && <SourceLabel source={source} />}
              {title && (
                <span className="chat-log-title">{title}</span>
              )}
            </div>
            {date && (
              <time className="chat-log-date">{date}</time>
            )}
          </div>
        )}
        <div className="chat-log-body">
          {children}
        </div>
      </div>
    </ChatLogContext.Provider>
  )
}
