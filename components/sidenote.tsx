"use client"

import { useEffect, useRef, useState } from "react"
import { uiConfig, applySidenoteConfig } from "@/lib/config/ui"
import React from "react"

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
    if (!shouldTruncate) {
      return actualContent
    }

    const { maxNoteLength, truncationSuffix, expandButtonText, collapseButtonText } = uiConfig.sidenotes
    const fullText = fullTextRef.current
    
    if (isExpanded) {
      return (
        <>
          {actualContent}
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
          {truncatedText}
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
      <label htmlFor={`sidenote-toggle-${id}`} className="margin-toggle sidenote-number">
        <a href={`#sidenote-${id}`} id={`sidenote-ref-${id}`} className="sidenote-number">
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

export function MarginNote({ id, children }: MarginNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldTruncate, setShouldTruncate] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const marginNoteId = `marginnote-${id || Math.random().toString(36).substr(2, 9)}`

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
    if (!shouldTruncate) {
      return children
    }

    const { maxNoteLength, truncationSuffix, expandButtonText, collapseButtonText } = uiConfig.sidenotes
    const textContent = getTextContent(children)
    
    if (isExpanded) {
      return (
        <>
          {children}
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
          {truncatedText}
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

  const className = `marginnote${shouldTruncate ? ' sidenote-truncatable' : ''}${isExpanded ? ' sidenote-expanded' : ''}`

  return (
    <span className="marginnote-wrapper">
      <input type="checkbox" id={marginNoteId} className="margin-toggle-input" />
      <span 
        ref={contentRef}
        className={className} 
        id={`marginnote-content-${id}`}
      >
        {renderContent()}
      </span>
    </span>
  )
}