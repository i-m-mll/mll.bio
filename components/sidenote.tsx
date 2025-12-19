"use client"

import { useEffect, useRef, useState } from "react"
import React from "react"
import { useMediaQuery } from "../hooks/use-media-query"
import { useTruncatableNote } from "../hooks/use-truncatable-note"
import tailwindConfig from "../tailwind.config"

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

export function Sidenote({ id, number, children, content }: SidenoteProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const isDesktop = useMediaQuery(`(min-width: ${tailwindConfig.theme.screens.desktop})`)

  // Use content prop if provided, otherwise use children
  const actualContent = content || children

  // Convert number to integer if it's a string
  const numberValue = typeof number === 'string' ? parseInt(number, 10) : number || 1

  // Use shared truncation logic
  const { shouldTruncate, isExpanded, renderContent } = useTruncatableNote({
    content: actualContent,
    isDesktop,
  })

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

  // Use shared truncation logic
  const { shouldTruncate, isExpanded, renderContent } = useTruncatableNote({
    content: children,
    isDesktop,
  })

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