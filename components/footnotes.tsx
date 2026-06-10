// Footnotes rendered at build/runtime without relying on client JS
import { renderInlineMarkdown } from "@/lib/utils"
import { uiConfig } from "@/lib/config/ui"
import { extractMarkdownFootnotes } from "@/lib/footnote-model"

interface FootnotesProps {
  content: string
}

export function Footnotes({ content }: FootnotesProps) {
  const items = extractMarkdownFootnotes(content, uiConfig.sidenotes.footnoteForceMarker)

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
