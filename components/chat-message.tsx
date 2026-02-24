"use client"

import type { ReactNode } from "react"

interface ChatMessageProps {
  role: "user" | "assistant"
  model?: string      // e.g., "claude-opus-4-6", shown as badge for assistant
  children: ReactNode // markdown content (already processed by MDX)
}

const modelDisplayNames: Record<string, string> = {
  "claude-opus-4-6": "Opus 4.6",
  "claude-opus-4": "Opus 4",
  "claude-sonnet-4": "Sonnet 4",
  "claude-3-5-sonnet": "Sonnet 3.5",
  "gpt-4o": "GPT-4o",
  "gpt-5": "GPT-5",
  "o3": "o3",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
}

function ModelBadge({ model }: { model: string }) {
  const display = modelDisplayNames[model] || model
  return (
    <span className="chat-message-model-badge">
      {display}
    </span>
  )
}

export default function ChatMessage({ role, model, children }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div className={`chat-message ${isUser ? "chat-message-user" : "chat-message-assistant"}`}>
      <div className="chat-message-header">
        <span className="chat-message-role">
          {isUser ? "User" : "Assistant"}
        </span>
        {!isUser && model && <ModelBadge model={model} />}
      </div>
      <div className="chat-message-content prose dark:prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  )
}
