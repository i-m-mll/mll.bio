export function isLikelySidenoteCodeExample(content: string): boolean {
  const trimmedContent = content.trim().toLowerCase()

  if (trimmedContent === 'your sidenote content` for the definition') {
    return true
  }

  const codePatterns = [
    /^your sidenote content/i,
    /^.*content.*for.*definition/i,
    /^\w+\s+(content|example|text)$/i,
    /content.*definition/i,
    /for the definition$/i,
  ]

  const isGeneric = trimmedContent.includes('your') &&
    trimmedContent.includes('content')

  return codePatterns.some(pattern => pattern.test(trimmedContent)) || isGeneric
}
