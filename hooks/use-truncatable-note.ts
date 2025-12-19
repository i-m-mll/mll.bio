"use client"

import { useState, useEffect, useCallback } from "react"
import { uiConfig, applySidenoteConfig } from "@/lib/config/ui"
import { renderInlineMarkdown } from "@/lib/utils"
import React from "react"

/**
 * Extracts text content from a React node tree.
 */
export function getTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return node.toString()
  if (Array.isArray(node)) return node.map(getTextContent).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return getTextContent((node as React.ReactElement).props.children)
  }
  return ''
}

/**
 * Truncates text at a word boundary near maxLength.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  // Find a good breaking point near the max length (prefer word boundaries)
  let truncateAt = maxLength
  const spaceIndex = text.lastIndexOf(' ', maxLength)
  if (spaceIndex > maxLength * 0.8) {
    truncateAt = spaceIndex
  }

  return text.substring(0, truncateAt)
}

interface UseTruncatableNoteOptions {
  content: React.ReactNode
  isDesktop: boolean
}

interface UseTruncatableNoteResult {
  isExpanded: boolean
  shouldTruncate: boolean
  toggleExpanded: () => void
  renderContent: () => React.ReactNode
}

/**
 * Hook for managing truncatable sidenote/marginnote content.
 * Handles:
 * - Determining if truncation is needed based on content length and screen size
 * - Managing expand/collapse state
 * - Rendering truncated or full content with appropriate buttons
 */
export function useTruncatableNote({
  content,
  isDesktop,
}: UseTruncatableNoteOptions): UseTruncatableNoteResult {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldTruncate, setShouldTruncate] = useState(false)
  const [fullText, setFullText] = useState('')

  // Apply configuration on mount
  useEffect(() => {
    applySidenoteConfig()
  }, [])

  // Check if truncation should be enabled
  useEffect(() => {
    const { maxNoteLength } = uiConfig.sidenotes

    // Disable truncation on non-desktop breakpoints – notes are inline there
    if (!isDesktop || maxNoteLength === null || maxNoteLength === undefined) {
      setShouldTruncate(false)
      return
    }

    const textContent = getTextContent(content)
    setFullText(textContent)

    if (textContent.length > maxNoteLength) {
      setShouldTruncate(true)
      setIsExpanded(false)
    } else {
      setShouldTruncate(false)
    }
  }, [content, isDesktop])

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const renderContent = useCallback((): React.ReactNode => {
    const renderMarkdownSpan = (text: string) =>
      React.createElement('span', {
        dangerouslySetInnerHTML: { __html: renderInlineMarkdown(text) }
      })

    if (!shouldTruncate) {
      return typeof content === 'string' ? renderMarkdownSpan(content) : content
    }

    const { maxNoteLength, truncationSuffix, expandButtonText, collapseButtonText } = uiConfig.sidenotes

    if (isExpanded) {
      return React.createElement(React.Fragment, null,
        typeof content === 'string' ? renderMarkdownSpan(content) : content,
        React.createElement('button', {
          className: 'sidenote-toggle-button',
          onClick: () => setIsExpanded(false),
          'aria-label': 'Collapse note'
        }, collapseButtonText)
      )
    } else {
      const truncatedText = truncateText(fullText, maxNoteLength!)
      return React.createElement(React.Fragment, null,
        typeof content === 'string' ? renderMarkdownSpan(truncatedText) : truncatedText,
        truncationSuffix,
        React.createElement('button', {
          className: 'sidenote-toggle-button',
          onClick: () => setIsExpanded(true),
          'aria-label': 'Expand note'
        }, expandButtonText)
      )
    }
  }, [shouldTruncate, isExpanded, content, fullText])

  return {
    isExpanded,
    shouldTruncate,
    toggleExpanded,
    renderContent,
  }
}
