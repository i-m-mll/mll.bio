"use client"

import { useEffect, useRef, useState } from "react"
import { uiConfig, applySidenoteConfig } from "@/lib/config/ui"
import React from "react"
import { useMediaQuery } from "../hooks/use-media-query"
import tailwindConfig from "../tailwind.config"
import { renderInlineMarkdown } from "@/lib/utils"

interface SidenoteProps {
  id: string
  number?: number
  type?: 'sidenote' | 'marginnote'
  children?: React.ReactNode
  content?: string // For backward compatibility with remark plugin
}

interface MarginNoteProps {
  id?: string
  children: React.ReactNode
  top?: string | number
  y?: string | number
  line?: number
  dataTargetPosition?: string
  dataPositioned?: string
  dataInCode?: string
  dataMobileVersion?: string
  dataFollowsCode?: string
}

export function Sidenote({ id, number, type = 'sidenote', children, content }: SidenoteProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldTruncate, setShouldTruncate] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const fullTextRef = useRef<string>('')

  // Apply configuration on mount
  useEffect(() => {
    applySidenoteConfig()
  }, [])

  // Use content prop if provided, otherwise use children
  const actualContent = content || children
  
  // Convert number to integer if it's a string
  const numberValue = typeof number === 'string' ? parseInt(number, 10) : number || 1

  // Convert content to text for length checking
  const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node
    if (typeof node === 'number') return node.toString()
    if (Array.isArray(node)) return node.map(getTextContent).join('')
    if (node && typeof node === 'object' && 'props' in node) {
      return getTextContent(node.props.children)
    }
    return ''
  }

  useEffect(() => {
    // Check if truncation should be enabled
    const { maxNoteLength } = uiConfig.sidenotes
    if (maxNoteLength === null || maxNoteLength === undefined) {
      setShouldTruncate(false)
      return
    }

    const textContent = getTextContent(actualContent)
    fullTextRef.current = textContent
    
    if (textContent.length > maxNoteLength) {
      setShouldTruncate(true)
      setIsExpanded(false) // Start collapsed
    } else {
      setShouldTruncate(false)
    }
  }, [actualContent])

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    
    // Find a good breaking point near the max length (prefer word boundaries)
    let truncateAt = maxLength
    const spaceIndex = text.lastIndexOf(' ', maxLength)
    if (spaceIndex > maxLength * 0.8) { // Only use space if it's not too far back
      truncateAt = spaceIndex
    }
    
    return text.substring(0, truncateAt)
  }

  const renderContent = () => {
    const renderMarkdownSpan = (text: string) => (
      <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }} />
    )

    if (!shouldTruncate) {
      return typeof actualContent === 'string' ? renderMarkdownSpan(actualContent) : actualContent
    }

    const { maxNoteLength, truncationSuffix, expandButtonText, collapseButtonText } = uiConfig.sidenotes
    const fullText = fullTextRef.current
    
    if (isExpanded) {
      return (
        <>
          {typeof actualContent === 'string' ? renderMarkdownSpan(actualContent) : actualContent}
          <button
            className="sidenote-toggle-button"
            onClick={() => setIsExpanded(false)}
            aria-label="Collapse note"
          >
            {collapseButtonText}
          </button>
        </>
      )
    } else {
      const truncatedText = truncateText(fullText, maxNoteLength!)
      return (
        <>
          {typeof actualContent === 'string' ? renderMarkdownSpan(truncatedText) : truncatedText}
          {truncationSuffix}
          <button
            className="sidenote-toggle-button"
            onClick={() => setIsExpanded(true)}
            aria-label="Expand note"
          >
            {expandButtonText}
          </button>
        </>
      )
    }
  }

  const className = `sidenote${shouldTruncate ? ' sidenote-truncatable' : ''}${isExpanded ? ' sidenote-expanded' : ''}`

  // Return the structure that the CSS expects - wrap in sidenote-wrapper
  return (
    <span className="sidenote-wrapper">
      {/*
       * Provide two anchors so each layout (desktop vs mobile) can jump to a
       * visible target without any runtime JavaScript. Only one anchor is
       * shown at a time via Tailwind breakpoints.
       */}
      <label htmlFor={`sidenote-toggle-${id}`} className="margin-toggle sidenote-number">
        {/* Desktop / ≥1051 px – jump to the margin-sidenote */}
        <a
          href={`#sidenote-${id}`}
          id={`sidenote-ref-${id}`}
          className="sidenote-number desktop:inline max-desktop:hidden"
        >
          {numberValue}
        </a>

        {/* Mobile / <1051 px – jump to the footnote list item */}
        <a
          href={`#footnote-${id}`}
          id={`footnote-ref-${id}`}
          className="sidenote-number max-desktop:inline desktop:hidden"
        >
          {numberValue}
        </a>
      </label>
      <input 
        type="checkbox" 
        id={`sidenote-toggle-${id}`} 
        className="margin-toggle-input" 
      />
      <span 
        ref={contentRef}
        id={`sidenote-${id}`} 
        className={className}
      >
        <a href={`#sidenote-ref-${id}`} className="sidenote-counter" aria-label={`Return to footnote ${id}`}>
          {numberValue}.
        </a>{" "}
        {renderContent()}
      </span>
    </span>
  )
}

export function MarginNote({ id, children, top, y, line, dataTargetPosition, dataPositioned, dataInCode, dataMobileVersion, dataFollowsCode }: MarginNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldTruncate, setShouldTruncate] = useState(false)
  const [generatedId, setGeneratedId] = useState<string>('')
  const contentRef = useRef<HTMLDivElement>(null)
  const isCodeBlock = dataInCode === 'true'
  const isPositioned = top !== undefined || y !== undefined || line !== undefined || dataTargetPosition !== undefined || dataPositioned === 'true'
  const isMobileVersion = dataMobileVersion === 'true'
  const isDesktop = useMediaQuery(`(min-width: ${tailwindConfig.theme.screens.desktop})`)

  // Generate ID on client side to avoid hydration mismatch
  useEffect(() => {
    if (!id && !generatedId) {
      setGeneratedId(`mn-${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [id, generatedId])

  const marginNoteId = id || generatedId || 'temp-id'

  // Apply configuration on mount
  useEffect(() => {
    applySidenoteConfig()
  }, [])

  // Convert children to text for length checking
  const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node
    if (typeof node === 'number') return node.toString()
    if (Array.isArray(node)) return node.map(getTextContent).join('')
    if (node && typeof node === 'object' && 'props' in node) {
      return getTextContent(node.props.children)
    }
    return ''
  }

  useEffect(() => {
    // Check if truncation should be enabled
    const { maxNoteLength } = uiConfig.sidenotes
    if (maxNoteLength === null || maxNoteLength === undefined) {
      setShouldTruncate(false)
      return
    }
    
    const textContent = getTextContent(children)
    if (textContent.length > maxNoteLength) {
      setShouldTruncate(true)
      setIsExpanded(false) // Start collapsed
    } else {
      setShouldTruncate(false)
    }
  }, [children])

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    
    // Find a good breaking point near the max length (prefer word boundaries)
    let truncateAt = maxLength
    const spaceIndex = text.lastIndexOf(' ', maxLength)
    if (spaceIndex > maxLength * 0.8) { // Only use space if it's not too far back
      truncateAt = spaceIndex
    }
    
    return text.substring(0, truncateAt)
  }

  const renderContent = () => {
    const renderMarkdownSpan = (text: string) => (
      <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }} />
    )

    if (!shouldTruncate) {
      return typeof children === 'string' ? renderMarkdownSpan(children) : children
    }

    const { maxNoteLength, truncationSuffix, expandButtonText, collapseButtonText } = uiConfig.sidenotes
    const textContent = getTextContent(children)
    
    if (isExpanded) {
      return (
        <>
          {typeof children === 'string' ? renderMarkdownSpan(children) : children}
          <button
            className="sidenote-toggle-button"
            onClick={() => setIsExpanded(false)}
            aria-label="Collapse note"
          >
            {collapseButtonText}
          </button>
        </>
      )
    } else {
      const truncatedText = truncateText(textContent, maxNoteLength!)
      return (
        <>
          {typeof children === 'string' ? renderMarkdownSpan(truncatedText) : truncatedText}
          {truncationSuffix}
          <button
            className="sidenote-toggle-button"
            onClick={() => setIsExpanded(true)}
            aria-label="Expand note"
          >
            {expandButtonText}
          </button>
        </>
      )
    }
  }

  if (isPositioned && !isMobileVersion) {
    let computedTop = y || top;
    
    // If target position is provided from remark plugin, use it (converted to CSS units)
    if (dataTargetPosition !== undefined) {
      const linePosition = parseInt(dataTargetPosition, 10);
      if (isCodeBlock) {
        /*
         * The baseline of the first code line isn't flush with the top of
         * the line-box; there's half of the extra leading that CSS inserts
         * for the declared line-height.  With `line-height = 1.7`, that
         * amounts to `(1.7 - 1) / 2 = 0.35` em.  We expose that as
         * --code-first-line-leading so both CSS and JS can stay in sync.
         */
        computedTop = `calc(var(--code-block-offset, 1rem) + var(--code-first-line-leading) + ${linePosition} * var(--code-line-height, 1.7) * 1em)`;
      } else {
        // Inline prose positioning: rely on relative wrapper; align to start of text
        computedTop = 0;
      }
    }
    
    const style: React.CSSProperties = isDesktop
      ? isCodeBlock
        ? {
            position: 'absolute',
            top: computedTop,
            left: '100%',
            marginLeft: 'var(--sidenote-margin-offset)',
          }
        : {
            marginTop: computedTop,
          }
      : {}

    const className = `marginnote marginnote-positioned${shouldTruncate ? ' sidenote-truncatable' : ''}${isExpanded ? ' sidenote-expanded' : ''}`

    return (
      <span
        ref={contentRef}
        className={className}
        id={`marginnote-content-${marginNoteId}`}
        style={style}
      >
        {renderContent()}
      </span>
    )
  }

  // Handle mobile version of positioned notes
  if (isMobileVersion) {
    const className = `marginnote marginnote-mobile${shouldTruncate ? ' sidenote-truncatable' : ''}${isExpanded ? ' sidenote-expanded' : ''}`
    const followsCode = dataFollowsCode === 'true'

    return (
      <span
        ref={contentRef}
        className={className}
        id={`marginnote-content-${marginNoteId}`}
        data-follows-code={followsCode ? 'true' : undefined}
      >
        {renderContent()}
      </span>
    )
  }

  const className = `marginnote${shouldTruncate ? ' sidenote-truncatable' : ''}${isExpanded ? ' sidenote-expanded' : ''}`

  return (
    <span className="marginnote-wrapper">
      <input type="checkbox" id={`marginnote-${marginNoteId}`} className="margin-toggle-input" />
      <span
        ref={contentRef}
        className={className}
        id={`marginnote-content-${marginNoteId}`}
      >
        {renderContent()}
      </span>
    </span>
  )
}