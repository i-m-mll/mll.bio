// Footnotes rendered at build/runtime without relying on client JS
import { renderInlineMarkdown } from "@/lib/utils"
import { uiConfig } from "@/lib/config/ui"

interface FootnotesProps {
  content: string
}

interface FootnoteItem {
  id: string
  number: number
  content: string
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
  // Remove code fences to avoid matching faux-definitions inside them
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '')

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
      while (i < lines.length) {
        const contLine = lines[i]
        if (/^\s{4,}.*/.test(contLine) || /^\t+.*/.test(contLine)) {
          body += ' ' + contLine.trim()
          i++
        } else if (contLine.trim() === '') {
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

      let footnoteContent = body.trim().replace(/\s+/g, ' ')

      // Strip the force-footnote marker if present so it doesn't appear in output.
      // Footnotes WITH the marker are kept as standard footnotes (the remark plugin
      // skips converting them to sidenotes), but the marker itself should be invisible.
      const forceMarker = uiConfig.sidenotes.footnoteForceMarker
      if (forceMarker && footnoteContent.startsWith(forceMarker)) {
        footnoteContent = footnoteContent.slice(forceMarker.length).trimStart()
      }

      if (footnoteContent.length >= 15 && !isLikelyCodeExample(footnoteContent)) {
        items.push({ id, number: counter, content: footnoteContent })
        counter++
      }
    } else {
      i++
    }
  }

  if (items.length === 0) return null

  return (
    <div className="footnotes-section">
      <ol className="footnotes-list">
        {items.map((footnote) => (
          <li key={footnote.id} className="footnote-item" id={`footnote-${footnote.id}`}>
            <a
              href={`#footnote-ref-${footnote.id}`}
              className="footnote-number-link"
              title="Return to text"
            >
              {footnote.number}.
            </a>{" "}
            <span
              className="footnote-content"
              dangerouslySetInnerHTML={{
                __html: renderInlineMarkdown(footnote.content),
              }}
            />
          </li>
        ))}
      </ol>
    </div>
  )
} 