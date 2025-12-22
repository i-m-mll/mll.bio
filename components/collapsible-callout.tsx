"use client"

import { useState, ReactNode, useEffect } from "react"
import { useMediaQuery } from "../hooks/use-media-query"
import tailwindConfig from "../tailwind.config"

type CalloutType = "info" | "notn1" | "strdiag" | "caption" | "warning" | "error" | "success"

interface CollapsibleCalloutProps {
  type: CalloutType
  title?: string | null  // null = no title, undefined = use default label
  children: ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
}

// Clean SVG icons for callouts (Material Design inspired)
const CalloutIcon = ({ type }: { type: CalloutType }) => {
  const iconClass = "w-4 h-4 flex-shrink-0"

  switch (type) {
    case "info":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )
    case "notn1":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M8 13h8" />
          <path d="M8 17h8" />
        </svg>
      )
    case "strdiag":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="6" height="6" rx="1" />
          <rect x="15" y="15" width="6" height="6" rx="1" />
          <path d="M9 6h6" />
          <path d="M9 18h6" />
          <path d="M6 9v6" />
          <path d="M18 9v6" />
        </svg>
      )
    case "warning":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    case "error":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )
    case "success":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="9 12 12 15 16 10" />
        </svg>
      )
    default:
      return null
  }
}

const typeStyles: Record<CalloutType, { bg: string; border: string; label: string }> = {
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-200 dark:border-blue-800",
    label: "Info",
  },
  notn1: {
    bg: "bg-purple-50 dark:bg-purple-950/50",
    border: "border-purple-200 dark:border-purple-800",
    label: "Formal Notation",
  },
  strdiag: {
    bg: "bg-teal-50 dark:bg-teal-950/50",
    border: "border-teal-200 dark:border-teal-800",
    label: "String Diagram",
  },
  caption: {
    bg: "bg-stone-50 dark:bg-stone-900/50",
    border: "border-stone-200 dark:border-stone-700",
    label: "",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-950/50",
    border: "border-yellow-200 dark:border-yellow-800",
    label: "Warning",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/50",
    border: "border-red-200 dark:border-red-800",
    label: "Error",
  },
  success: {
    bg: "bg-green-50 dark:bg-green-950/50",
    border: "border-green-200 dark:border-green-800",
    label: "Success",
  },
}

export function CollapsibleCallout({
  type,
  title,
  children,
  defaultOpen = false,
  collapsible = true,
}: CollapsibleCalloutProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const styles = typeStyles[type]

  // Caption callout renders as a margin note on desktop, inline on mobile
  if (type === "caption") {
    return <FigureCaption>{children}</FigureCaption>
  }

  // null = explicitly no title, undefined = use default label
  const displayTitle = title === null ? null : (title || styles.label)

  // No title means no header to click, so force non-collapsible
  const isCollapsible = collapsible && displayTitle !== null

  if (!isCollapsible) {
    return (
      <div className={`my-4 rounded-md border ${styles.bg} ${styles.border}`}>
        {displayTitle && (
          <div className="flex items-center gap-2 px-4 py-2 font-semibold border-b border-inherit">
            <CalloutIcon type={type} />
            <span>{displayTitle}</span>
          </div>
        )}
        <div className="px-4 py-3 prose dark:prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={`my-4 rounded-md border ${styles.bg} ${styles.border}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-2 font-semibold text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isOpen ? "bg-black/5 dark:bg-white/5 rounded-t-md" : "rounded-md"}`}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <CalloutIcon type={type} />
          <span>{displayTitle}</span>
        </span>
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
      </button>
      {isOpen && (
        <div className="px-4 py-3 border-t border-inherit prose dark:prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {children}
        </div>
      )}
    </div>
  )
}

// Convenience components for each callout type
export function InfoCallout({ title, children, defaultOpen, collapsible }: Omit<CollapsibleCalloutProps, "type">) {
  return <CollapsibleCallout type="info" title={title} defaultOpen={defaultOpen} collapsible={collapsible}>{children}</CollapsibleCallout>
}

export function NotationCallout({ title, children, defaultOpen, collapsible }: Omit<CollapsibleCalloutProps, "type">) {
  return <CollapsibleCallout type="notn1" title={title} defaultOpen={defaultOpen} collapsible={collapsible}>{children}</CollapsibleCallout>
}

export function StringDiagramCallout({ title, children, defaultOpen, collapsible }: Omit<CollapsibleCalloutProps, "type">) {
  return <CollapsibleCallout type="strdiag" title={title} defaultOpen={defaultOpen} collapsible={collapsible}>{children}</CollapsibleCallout>
}

export function CaptionCallout({ children }: { children: ReactNode }) {
  return <CollapsibleCallout type="caption">{children}</CollapsibleCallout>
}

// FigureCaption component - renders as margin note on desktop, inline on mobile
function FigureCaption({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery(`(min-width: ${tailwindConfig.theme.screens.desktop})`)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR/hydration, render the mobile version (inline caption)
  if (!mounted) {
    return (
      <div className="figure-caption text-sm text-muted-foreground italic my-4 ml-6 max-w-[calc(100%-4rem)]">
        {children}
      </div>
    )
  }

  if (isDesktop) {
    // Desktop: render as margin note - floats to the right margin
    return (
      <span className="figure-caption-margin marginnote">
        {children}
      </span>
    )
  }

  // Mobile: render inline like other margin notes
  return (
    <div className="figure-caption text-sm text-muted-foreground italic my-4 ml-6 max-w-[calc(100%-4rem)]">
      {children}
    </div>
  )
}
