const ALLOWED_TAGS = {
  a: new Set(["href", "title", "class", "target", "rel"]),
  blockquote: new Set(["class"]),
  br: new Set([]),
  code: new Set(["class"]),
  del: new Set([]),
  div: new Set(["class", "data-unknown-directive"]),
  em: new Set([]),
  h1: new Set(["class"]),
  h2: new Set(["class"]),
  h3: new Set(["class"]),
  h4: new Set(["class"]),
  h5: new Set(["class"]),
  h6: new Set(["class"]),
  li: new Set(["class"]),
  mark: new Set(["class", "data-search-highlight"]),
  ol: new Set(["class"]),
  p: new Set(["class"]),
  pre: new Set(["class"]),
  span: new Set(["class", "data-unknown-directive"]),
  strong: new Set([]),
  ul: new Set(["class"]),
}

const RAW_TEXT_TAGS = new Set(["script", "style", "iframe", "object", "embed", "svg", "math"])
const VOID_TAGS = new Set(["br"])
const SAFE_CLASS_TOKEN = /^[A-Za-z0-9_:/.[\]%-]+$/

export function escapeHtml(value) {
  return String(value)
    .replace(/&(?!#\d+;|#x[0-9A-Fa-f]+;|[A-Za-z][A-Za-z0-9]+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function sanitizeUrl(value) {
  const trimmed = String(value).trim().replace(/[\u0000-\u001F\u007F\s]+/g, "")
  if (!trimmed) return null

  const lower = trimmed.toLowerCase()
  if (lower.startsWith("/") || lower.startsWith("#") || lower.startsWith("./") || lower.startsWith("../")) {
    return trimmed
  }

  const protocolMatch = lower.match(/^([a-z][a-z0-9+.-]*):/)
  if (!protocolMatch) return trimmed

  return ["http:", "https:", "mailto:"].includes(protocolMatch[0]) ? trimmed : null
}

export function sanitizeClassName(value) {
  const tokens = String(value).split(/\s+/).filter(Boolean)
  return tokens.filter((token) => SAFE_CLASS_TOKEN.test(token)).join(" ")
}

export function sanitizeHtml(html) {
  const input = String(html)
  let output = ""
  let cursor = 0
  let skipRawTextUntil = null
  const tagPattern = /<!--[\s\S]*?-->|<\/\s*[A-Za-z][^>]*>|<[A-Za-z][^>]*>/g

  for (const match of input.matchAll(tagPattern)) {
    const token = match[0]
    const index = match.index ?? 0

    if (skipRawTextUntil) {
      if (isClosingTag(token, skipRawTextUntil)) {
        skipRawTextUntil = null
      }
      cursor = index + token.length
      continue
    }

    output += escapeHtml(input.slice(cursor, index))
    cursor = index + token.length

    if (token.startsWith("<!--")) continue

    const closing = token.match(/^<\s*\/\s*([A-Za-z][\w:-]*)\s*>$/)
    if (closing) {
      const tagName = closing[1].toLowerCase()
      if (ALLOWED_TAGS[tagName]) output += `</${tagName}>`
      continue
    }

    const opening = token.match(/^<\s*([A-Za-z][\w:-]*)([\s\S]*?)\/?\s*>$/)
    if (!opening) {
      output += escapeHtml(token)
      continue
    }

    const tagName = opening[1].toLowerCase()
    if (!ALLOWED_TAGS[tagName]) {
      if (RAW_TEXT_TAGS.has(tagName)) skipRawTextUntil = tagName
      continue
    }

    const attrs = sanitizeAttributes(tagName, opening[2] ?? "")
    const attrText = attrs.length ? ` ${attrs.join(" ")}` : ""
    const selfClosing = VOID_TAGS.has(tagName) || /\/\s*>$/.test(token)
    output += `<${tagName}${attrText}${selfClosing && !VOID_TAGS.has(tagName) ? " /" : ""}>`
  }

  if (!skipRawTextUntil) output += escapeHtml(input.slice(cursor))
  return output
}

function sanitizeAttributes(tagName, source) {
  const allowed = ALLOWED_TAGS[tagName]
  const attrs = []
  const attrPattern = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

  for (const match of source.matchAll(attrPattern)) {
    const rawName = match[1]
    const name = rawName.toLowerCase()
    if (!allowed.has(name) || name.startsWith("on") || name === "style") continue

    const rawValue = match[2] ?? match[3] ?? match[4] ?? ""
    if (name === "href") {
      const href = sanitizeUrl(rawValue)
      if (!href) continue
      attrs.push(`href="${escapeHtml(href)}"`)
      continue
    }

    if (name === "target") {
      if (rawValue === "_blank") attrs.push('target="_blank"')
      continue
    }

    if (name === "rel") {
      const rel = sanitizeClassName(rawValue)
      if (rel) attrs.push(`rel="${escapeHtml(rel)}"`)
      continue
    }

    if (name === "class") {
      const className = sanitizeClassName(rawValue)
      if (className) attrs.push(`class="${escapeHtml(className)}"`)
      continue
    }

    if (name.startsWith("data-")) {
      if (rawValue === "") {
        attrs.push(name)
      } else {
        attrs.push(`${name}="${escapeHtml(rawValue)}"`)
      }
      continue
    }

    attrs.push(`${name}="${escapeHtml(rawValue)}"`)
  }

  if (tagName === "a" && attrs.some((attr) => attr === 'target="_blank"') && !attrs.some((attr) => attr.startsWith("rel="))) {
    attrs.push('rel="noopener noreferrer"')
  }

  return attrs
}

function isClosingTag(token, tagName) {
  return new RegExp(`^<\\s*\\/\\s*${tagName}\\s*>$`, "i").test(token)
}
