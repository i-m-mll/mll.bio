// This file is deprecated - diff highlighting is now done via MDX component injection
// See: lib/construct-diff-mdx.ts and components/diff-markers.tsx

// Keeping exports for backwards compatibility, but these are no longer used
export interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  lineNumber?: number
}

export function getAddedLineContent(diffLines: DiffLine[]): Set<string> {
  const added = new Set<string>()
  for (const line of diffLines) {
    if (line.type === 'add' && line.content.trim()) {
      added.add(line.content.trim())
    }
  }
  return added
}

export function getRemovedLineContent(diffLines: DiffLine[]): Set<string> {
  const removed = new Set<string>()
  for (const line of diffLines) {
    if (line.type === 'remove' && line.content.trim()) {
      removed.add(line.content.trim())
    }
  }
  return removed
}
