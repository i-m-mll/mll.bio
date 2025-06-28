"use client"

import { useEffect, useState } from "react"
import { renderInlineMarkdown } from "@/lib/utils"

interface FootnotesProps {
  content: string
}

interface FootnoteItem {
  id: string
  number: number
  content: string
}

// Hook to check if we're in mobile/tablet mode
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 1050
  })

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 1050)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}

// Helper function to check if content looks like a code example (copied from remark plugin)
function isLikelyCodeExample(content: string): boolean {
  const trimmedContent = content.trim().toLowerCase()
  
  // Check for the specific problematic pattern from the demo
  if (trimmedContent === 'your sidenote content` for the definition') {
    return true
  }
  
  // Check for other common patterns that indicate this is a code example
  const codePatterns = [
    /^your sidenote content/i, // The specific example from the demo
    /^.*content.*for.*definition/i, // Generic example pattern
    /^\w+\s+(content|example|text)$/i, // Short placeholder text
    /content.*definition/i, // Generic pattern
    /for the definition$/i, // Ends with "for the definition"
  ]
  
  // Also check if the content is very generic/placeholder-like
  const isGeneric = trimmedContent.includes('your') && 
                   trimmedContent.includes('content')
  
  return codePatterns.some(pattern => pattern.test(trimmedContent)) || isGeneric
}

export function Footnotes({ content }: FootnotesProps) {
  const [footnotes, setFootnotes] = useState<FootnoteItem[]>([])
  const isMobile = useIsMobile()

  useEffect(() => {
    // Remove code blocks to avoid parsing them as footnotes
    const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '')
    
    // Extract footnotes (support multi-line & indented continuation lines)
    const items: FootnoteItem[] = []
    const lines = contentWithoutCodeBlocks.split(/\r?\n/)
    let i = 0
    let counter = 1

    while (i < lines.length) {
      const line = lines[i]
      const startMatch = line.match(/^\[\^([^\]]+)\]:\s*(.*)$/)
      if (startMatch) {
        const id = startMatch[1]
        let body = startMatch[2]
        i++
        // Gather subsequent indented lines (4 spaces or a tab) as part of the footnote
        while (i < lines.length) {
          const contLine = lines[i]
          if (/^\s{4,}.*/.test(contLine) || /^\t+.*/.test(contLine)) {
            body += ' ' + contLine.trim()
            i++
          } else if (contLine.trim() === '') {
            // Blank line may separate paragraphs; include and continue if next line is indented
            const nextLine = lines[i + 1]
            if (nextLine && (/^\s{4,}.*/.test(nextLine) || /^\t+.*/.test(nextLine))) {
              body += ' '
              i++
            } else {
              break
            }
          } else {
            break
          }
        }

        const footnoteContent = body.trim().replace(/\s+/g, ' ')

        // Same filtering as remark plugin
        if (footnoteContent.length >= 15 && !isLikelyCodeExample(footnoteContent)) {
          items.push({ id, number: counter, content: footnoteContent })
          counter++
        }
      } else {
        i++
      }
    }

    console.log('Footnotes found:', items.length, 'isMobile:', isMobile)
    setFootnotes(items)
  }, [content, isMobile])

  // Only render on mobile/tablet
  if (!isMobile || footnotes.length === 0) {
    return null
  }

  return (
    <div className="footnotes-section">
      <ol className="footnotes-list">
        {footnotes.map((footnote) => (
          <li key={footnote.id} className="footnote-item" id={`footnote-${footnote.id}`}>
            <a 
              href={`#footnote-ref-${footnote.id}`} 
              className="footnote-number-link"
              title="Return to text"
            >
              {footnote.number}.
            </a>
            <span className="footnote-content" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(footnote.content) }} />
          </li>
        ))}
      </ol>
    </div>
  )
} 