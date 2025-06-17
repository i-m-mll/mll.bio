"use client"

import { useEffect, useState } from "react"

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
  const [isMobile, setIsMobile] = useState(false)

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
    
    // Extract footnotes from the content - match the exact format in the markdown
    // Look for [^id]: content at the beginning of a line
    const footnoteRegex = /^\[\^([^\]]+)\]:\s*(.+)$/gm
    const items: FootnoteItem[] = []
    let match
    let counter = 1

    // Reset regex lastIndex to ensure we start from the beginning
    footnoteRegex.lastIndex = 0
    
    while ((match = footnoteRegex.exec(contentWithoutCodeBlocks)) !== null) {
      const id = match[1]
      const footnoteContent = match[2].trim()
      
      // Use the SAME filtering logic as the remark plugin
      if (footnoteContent.length < 15 || isLikelyCodeExample(footnoteContent)) {
        continue // Skip this footnote, same as remark plugin
      }
      
      items.push({ 
        id, 
        number: counter, 
        content: footnoteContent 
      })
      counter++
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
          <li key={footnote.id} className="footnote-item" id={`sidenote-${footnote.id}`}>
            <a 
              href={`#sidenote-ref-${footnote.id}`} 
              className="footnote-number-link"
              title="Return to text"
            >
              {footnote.number}.
            </a>
            <span className="footnote-content">
              {footnote.content}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
} 