"use client"

import { useState, type ReactNode } from "react"

interface ThinkingBlockProps {
  title?: string     // optional thinking summary
  duration?: string  // e.g., "12s", "2.3s"
  children: ReactNode
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-3 h-3 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function ThinkingBlock({ title, duration, children }: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="thinking-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="thinking-block-header"
        aria-expanded={isOpen}
      >
        <span className="thinking-block-label">
          <span className="thinking-block-label-text">
            {title || "Thinking"}
          </span>
          {duration && (
            <span className="thinking-block-duration">{duration}</span>
          )}
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      {isOpen && (
        <div className="thinking-block-content prose dark:prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {children}
        </div>
      )}
    </div>
  )
}
