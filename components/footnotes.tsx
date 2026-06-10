// Footnotes rendered at build/runtime without relying on client JS
import { renderInlineMarkdown } from "@/lib/utils"
import { uiConfig } from "@/lib/config/ui"
import { isLikelySidenoteCodeExample } from "@/lib/sidenote-code-example"

interface FootnotesProps {
  content: string
}

interface FootnoteItem {
  id: string
  number: number
  content: string
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

      if (footnoteContent.length >= 15 && !isLikelySidenoteCodeExample(footnoteContent)) {
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
