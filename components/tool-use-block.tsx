"use client"

import { useState, useRef, useEffect, type ReactNode } from "react"

interface ToolUseProps {
  name: string        // tool name, e.g., "Edit", "Bash", "Glob"
  children?: ReactNode // tool result content
}

/** Max height in px before "show more" truncation kicks in */
const TOOL_RESULT_MAX_HEIGHT = 200

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

export function ToolUse({ name, children }: ToolUseProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setIsOverflowing(contentRef.current.scrollHeight > TOOL_RESULT_MAX_HEIGHT)
    }
  }, [isOpen])

  const hasContent = children !== undefined && children !== null

  return (
    <div className="tool-use-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tool-use-header"
        aria-expanded={isOpen}
      >
        <span className="tool-use-label">
          <span className="tool-use-name-badge">{name}</span>
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      {isOpen && hasContent && (
        <div className="tool-use-content-wrapper">
          <div
            ref={contentRef}
            className={`tool-use-content font-mono text-sm ${
              !showAll && isOverflowing ? "tool-use-content-truncated" : ""
            }`}
            style={
              !showAll && isOverflowing
                ? { maxHeight: `${TOOL_RESULT_MAX_HEIGHT}px` }
                : undefined
            }
          >
            <div className="prose dark:prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {children}
            </div>
          </div>
          {isOverflowing && !showAll && (
            <button
              type="button"
              className="tool-use-show-more"
              onClick={() => setShowAll(true)}
            >
              Show more
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ToolUse
