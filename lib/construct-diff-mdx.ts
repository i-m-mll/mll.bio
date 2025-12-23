import * as Diff from 'diff'

/**
 * Strip frontmatter from MDX content
 */
function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n/, '')
}

/**
 * Extract frontmatter from MDX content
 */
function extractFrontmatter(content: string): string {
  const match = content.match(/^(---\n[\s\S]*?\n---\n)/)
  return match ? match[1] : ''
}

/**
 * Split content into paragraphs (separated by blank lines)
 * Preserves code blocks as single units
 */
function splitIntoParagraphs(content: string): string[] {
  const paragraphs: string[] = []
  let current = ''
  let inCodeBlock = false

  for (const line of content.split('\n')) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
    }

    if (line.trim() === '' && !inCodeBlock) {
      if (current.trim()) {
        paragraphs.push(current.trim())
      }
      current = ''
    } else {
      current += (current ? '\n' : '') + line
    }
  }

  if (current.trim()) {
    paragraphs.push(current.trim())
  }

  return paragraphs
}

/**
 * Check if content is safe to wrap with diff markers.
 */
function isSafeToWrap(content: string): boolean {
  const trimmed = content.trim()

  if (!trimmed) return false

  // Skip JSX tags
  if (/<[A-Z]/.test(trimmed) || /<\/[A-Z]/.test(trimmed)) return false

  // Skip code blocks
  if (trimmed.startsWith('```')) return false

  // Skip imports/exports
  if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) return false

  // Skip MDX expressions
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return false

  // Skip HTML-like tags at start
  if (trimmed.startsWith('<') && !trimmed.startsWith('<http')) return false

  return true
}

/**
 * Split text at markdown/MDX structure boundaries.
 * Returns array of segments that are safe to wrap individually.
 */
function splitAtBoundaries(text: string): string[] {
  // Match markdown structures that shouldn't be split:
  // - Complete inline code spans: `...`
  // - Complete inline math spans: $...$
  // - Complete display math spans: $$...$$
  // - Links: [text](url) or [text][ref]
  // - Images: ![alt](url)
  // - Footnote refs: [^note]
  // - Emphasis: *, **, _, __
  // - JSX/HTML tags
  // - Newlines
  // - Brackets, quotes, parens (to avoid breaking markdown syntax)
  const boundaryPattern = new RegExp(
    '(' +
    '`[^`]+`' +            // complete inline code spans
    '|\\$\\$[^$]+\\$\\$' + // complete display math spans (must come before inline)
    '|\\$[^$]+\\$' +       // complete inline math spans
    '|!?\\[[^\\]]*\\](?:\\([^)]*\\)|\\[[^\\]]*\\])' + // links and images [text](url) or [text][ref]
    '|\\[\\^[^\\]]+\\]' +  // footnote references [^note]
    '|\\*\\*?' +           // * or **
    '|__?' +               // _ or __
    '|`+' +                // remaining backticks (for unclosed)
    '|\\$\\$?' +           // remaining $ or $$ (for unclosed)
    '|<[A-Za-z][^>]*>' +   // opening tags
    '|</[A-Za-z][^>]*>' +  // closing tags
    '|\\n' +               // newlines
    '|[\\[\\]()"\']' +     // brackets, parens, quotes
    ')',
    'g'
  )

  const segments: string[] = []
  let lastIndex = 0
  let match

  while ((match = boundaryPattern.exec(text)) !== null) {
    // Add text before the boundary
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index))
    }
    // Add the boundary marker itself (not wrapped)
    segments.push(match[0])
    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex))
  }

  return segments
}

/**
 * Check if a segment is a markdown/MDX boundary marker
 */
function isBoundaryMarker(segment: string): boolean {
  // Must match the same patterns as splitAtBoundaries
  const pattern = new RegExp(
    '^(' +
    '`[^`]+`' +            // complete inline code spans
    '|\\$\\$[^$]+\\$\\$' + // complete display math spans
    '|\\$[^$]+\\$' +       // complete inline math spans
    '|!?\\[[^\\]]*\\](?:\\([^)]*\\)|\\[[^\\]]*\\])' + // links and images
    '|\\[\\^[^\\]]+\\]' +  // footnote references
    '|\\*\\*?' +           // * or **
    '|__?' +               // _ or __
    '|`+' +                // remaining backticks
    '|\\$\\$?' +           // remaining $ or $$
    '|<[A-Za-z][^>]*>' +   // opening tags
    '|</[A-Za-z][^>]*>' +  // closing tags
    '|\\n' +               // newlines
    '|[\\[\\]()"\']' +     // brackets, parens, quotes
    ')$'
  )
  return pattern.test(segment)
}

/**
 * Wrap text with diff marker, splitting at boundaries to avoid structure issues.
 * Tracks inline code and math state to avoid injecting JSX inside backticks or $.
 */
function wrapWithSplitting(text: string, type: 'add' | 'del'): string {
  const tag = type === 'add' ? 'DiffAdd' : 'DiffDel'
  const segments = splitAtBoundaries(text)

  let result = ''
  let insideCode = false  // Track if we're inside inline code (backticks)
  let insideMath = false  // Track if we're inside math ($)

  for (const segment of segments) {
    // Check if this is a backtick sequence (toggles code state)
    if (/^`+$/.test(segment)) {
      insideCode = !insideCode
      result += segment
    } else if (/^\$\$?$/.test(segment)) {
      // Math delimiter ($ or $$) - only toggle if not inside code
      if (!insideCode) {
        insideMath = !insideMath
      }
      result += segment
    } else if (isBoundaryMarker(segment)) {
      // Don't wrap boundary markers
      result += segment
    } else if (insideCode || insideMath) {
      // Inside inline code or math - don't wrap, just pass through
      // JSX tags inside these would render as literal text or break parsing
      result += segment
    } else if (segment.trim()) {
      // Outside code/math, wrap non-empty text segments
      result += `<${tag}>${segment}</${tag}>`
    } else {
      // Preserve whitespace without wrapping
      result += segment
    }
  }

  return result
}

/**
 * Check if a position in text is inside inline code (backticks) or math ($).
 * Counts delimiters before the position - odd count means inside.
 */
function isInsideCodeOrMath(text: string, position: number): boolean {
  let inCode = false
  let inMath = false

  for (let i = 0; i < position && i < text.length; i++) {
    if (text[i] === '`') {
      inCode = !inCode
    } else if (text[i] === '$' && !inCode) {
      // Only toggle math if not inside code (code takes precedence)
      inMath = !inMath
    }
  }

  return inCode || inMath
}

/**
 * Perform word-level diff within a single paragraph.
 * Returns the paragraph with inline diff markers.
 * Splits at markdown boundaries to avoid structure issues.
 * Checks context to avoid wrapping content inside inline code.
 */
function diffParagraphWords(oldPara: string, newPara: string): string {
  const changes = Diff.diffWords(oldPara, newPara)

  // First pass: build result and track positions
  let result = ''
  let newParaPosition = 0  // Track position in newPara for context checking

  for (const change of changes) {
    const value = change.value

    if (change.added) {
      // Check if this position in the new paragraph is inside inline code or math
      // We need to check the result we're building, which mirrors newPara structure
      const wouldBeInsideCodeOrMath = isInsideCodeOrMath(result + value, result.length)

      if (wouldBeInsideCodeOrMath) {
        // Inside inline code/math - don't wrap, just pass through
        result += value
      } else {
        result += wrapWithSplitting(value, 'add')
      }
      newParaPosition += value.length
    } else if (change.removed) {
      // For deletions, check the position in the OLD paragraph context
      // But since we're inserting into the result stream, use result position
      const wouldBeInsideCodeOrMath = isInsideCodeOrMath(result, result.length)

      if (wouldBeInsideCodeOrMath) {
        // Would be inserted inside code/math context - skip deletion markers
        // (deletions from inside code/math can't be shown inline)
      } else {
        result += wrapWithSplitting(value, 'del')
      }
    } else {
      // Unchanged - pass through
      result += value
      newParaPosition += value.length
    }
  }

  return result
}

/**
 * Construct a diff-marked MDX string.
 *
 * Strategy:
 * 1. Split into paragraphs
 * 2. Diff paragraphs to find matches/changes
 * 3. For modified paragraphs, do word-level diff
 * 4. Skip unsafe content (JSX, code blocks)
 */
export function constructDiffMdx(oldContent: string, newContent: string): string {
  const frontmatter = extractFrontmatter(newContent)
  const oldBody = stripFrontmatter(oldContent)
  const newBody = stripFrontmatter(newContent)

  const oldParas = splitIntoParagraphs(oldBody)
  const newParas = splitIntoParagraphs(newBody)

  // Diff at paragraph level
  const changes = Diff.diffArrays(oldParas, newParas)

  const resultParas: string[] = []
  let i = 0

  while (i < changes.length) {
    const change = changes[i]

    // Check for modification (removed + added)
    if (change.removed && i + 1 < changes.length && changes[i + 1].added) {
      const removedParas = change.value
      const addedParas = changes[i + 1].value

      // Try to match up paragraphs for word-level diff
      const maxLen = Math.max(removedParas.length, addedParas.length)

      for (let j = 0; j < maxLen; j++) {
        const oldPara = removedParas[j]
        const newPara = addedParas[j]

        if (oldPara && newPara) {
          // Both exist - do word-level diff if safe
          if (isSafeToWrap(oldPara) && isSafeToWrap(newPara)) {
            resultParas.push(diffParagraphWords(oldPara, newPara))
          } else {
            // Not safe, just use new version
            resultParas.push(newPara)
          }
        } else if (newPara) {
          // Only new - mark as addition
          if (isSafeToWrap(newPara)) {
            resultParas.push(`<DiffAdd>${newPara}</DiffAdd>`)
          } else {
            resultParas.push(newPara)
          }
        } else if (oldPara) {
          // Only old - mark as deletion
          if (isSafeToWrap(oldPara)) {
            resultParas.push(`<DiffDel>${oldPara}</DiffDel>`)
          }
          // If not safe, just skip it (don't show deletion)
        }
      }

      i += 2
      continue
    }

    if (change.added) {
      for (const para of change.value) {
        if (isSafeToWrap(para)) {
          resultParas.push(`<DiffAdd>${para}</DiffAdd>`)
        } else {
          resultParas.push(para)
        }
      }
    } else if (change.removed) {
      for (const para of change.value) {
        if (isSafeToWrap(para)) {
          resultParas.push(`<DiffDel>${para}</DiffDel>`)
        }
        // Skip unsafe deletions
      }
    } else {
      // Unchanged
      resultParas.push(...change.value)
    }

    i++
  }

  return frontmatter + resultParas.join('\n\n')
}
