import { isLikelySidenoteCodeExample } from "@/lib/sidenote-code-example"

export interface FootnoteItem {
  id: string
  number: number
  content: string
}

export function cleanFootnoteContent(content: string, forceMarker?: string): string {
  let clean = content.trim().replace(/\s+/g, " ")
  if (forceMarker && clean.startsWith(forceMarker)) {
    clean = clean.slice(forceMarker.length).trimStart()
  }
  return clean
}

export function hasForceFootnoteMarker(content: string, forceMarker?: string): boolean {
  return Boolean(forceMarker && content.trimStart().startsWith(forceMarker))
}

export function shouldRenderFootnoteContent(content: string, forceMarker?: string): boolean {
  const clean = cleanFootnoteContent(content, forceMarker)
  return clean.length >= 15 && !isLikelySidenoteCodeExample(clean)
}

export function extractMarkdownFootnotes(content: string, forceMarker?: string): FootnoteItem[] {
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, "")
  const items: FootnoteItem[] = []
  const lines = contentWithoutCodeBlocks.split(/\r?\n/)
  let i = 0
  let counter = 1

  while (i < lines.length) {
    const line = lines[i]
    const startMatch = line.match(/^\[\^([^\]]+)\]:\s*(.*)$/)
    if (!startMatch) {
      i++
      continue
    }

    const id = startMatch[1]
    let body = startMatch[2]
    i++

    while (i < lines.length) {
      const continuation = lines[i]
      if (/^\s{4,}.*/.test(continuation) || /^\t+.*/.test(continuation)) {
        body += " " + continuation.trim()
        i++
        continue
      }

      if (continuation.trim() === "") {
        const nextLine = lines[i + 1]
        if (nextLine && (/^\s{4,}.*/.test(nextLine) || /^\t+.*/.test(nextLine))) {
          body += " "
          i++
          continue
        }
      }

      break
    }

    if (shouldRenderFootnoteContent(body, forceMarker)) {
      items.push({
        id,
        number: counter,
        content: cleanFootnoteContent(body, forceMarker),
      })
      counter++
    }
  }

  return items
}
