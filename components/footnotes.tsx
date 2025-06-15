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

export function Footnotes({ content }: FootnotesProps) {
  const [footnotes, setFootnotes] = useState<FootnoteItem[]>([])

  useEffect(() => {
    // First, remove code blocks to avoid parsing them as footnotes
    const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '')
    
    // Extract footnotes from the content - look for footnote definitions
    const footnoteRegex = /^\[\^([^\]]+)\]:\s*(.+?)(?=\n\n|\n\[\^|\n$|$)/gm
    const items: FootnoteItem[] = []
    let match
    let counter = 1

    // Reset regex lastIndex to ensure we start from the beginning
    footnoteRegex.lastIndex = 0
    
    while ((match = footnoteRegex.exec(contentWithoutCodeBlocks)) !== null) {
      const id = match[1]
      const footnoteContent = match[2].trim()
      
      // Only include if it's a real footnote
      // Skip if it's clearly a code example (starts with backtick or is very short)
      // But allow content that contains backticks if it's substantial content
      const isCodeExample = footnoteContent.startsWith('`') && footnoteContent.endsWith('`') && footnoteContent.length < 50
      const isTooShort = footnoteContent.length < 10
      
      if (!isCodeExample && !isTooShort) {
        items.push({ 
          id, 
          number: counter, 
          content: footnoteContent 
        })
        counter++
      }
    }

    setFootnotes(items)
  }, [content])

  if (footnotes.length === 0) {
    return null
  }

  return (
    <div className="footnotes-section">
      <ol className="footnotes-list">
        {footnotes.map((footnote) => (
          <li key={footnote.id} className="footnote-item" id={`footnote-${footnote.id}`}>
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