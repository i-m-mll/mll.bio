#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const parse5 = require("parse5")

const exportRoot = process.argv[2]
if (!exportRoot) {
  console.error("Usage: node scripts/import-substack-export.cjs /path/to/substack-export [--force-locked]")
  process.exit(1)
}
const forceLocked = process.argv.includes("--force-locked")

const projectRoot = process.cwd()
const writingRoot = "/Users/mll/Main/20 Writing"
const postsDir = path.join(exportRoot, "posts")
const postsCsvPath = path.join(exportRoot, "posts.csv")
const inkhavenDir = path.join(writingRoot, "15 Series", "inkhaven")
const unclenchingDir = path.join(writingRoot, "15 Series", "unclenching")
const oldInkhavenDir = path.join(writingRoot, "10 Posts", "00 Inkhaven")

const importedSlugToPath = new Map()

const inkhavenPosts = [
  {
    source: "local",
    oldPath: path.join(oldInkhavenDir, "1-over-the-moon.md"),
    slug: "over-the-moon",
    title: "Over the moon",
    created: "2026-04-01",
    order: 1,
  },
  {
    source: "local",
    oldPath: path.join(oldInkhavenDir, "2-artificial-and-organic.md"),
    slug: "the-artificial-and-the-organic",
    title: "The artificial and the organic",
    created: "2026-04-02",
    order: 2,
  },
  {
    source: "export",
    exportSlug: "the-one-that-loved-me-most",
    oldPath: path.join(oldInkhavenDir, "the-one-that-loved-me-most.md"),
    outputSlug: "the-one-that-loved-me-most",
    order: 3,
  },
  {
    source: "export",
    exportSlug: "the-blueberries-of-wrath",
    oldPath: path.join(oldInkhavenDir, "the-blueberries-of-wrath.md"),
    outputSlug: "the-blueberries-of-wrath",
    order: 4,
  },
  { source: "export", exportSlug: "eggs", outputSlug: "eggs", order: 5 },
  { source: "export", exportSlug: "lightly", outputSlug: "lightly", order: 6 },
  { source: "export", exportSlug: "bird-bird-bird", outputSlug: "bird-bird-bird", order: 7 },
  { source: "export", exportSlug: "two-poems", outputSlug: "two-poems", order: 8 },
  {
    source: "export",
    exportSlug: "listen-to-this-classical-music",
    outputSlug: "listen-to-this-classical-music-1",
    order: 9,
  },
  {
    source: "export",
    exportSlug: "meditative-bliss-states-are-the-opposite",
    outputSlug: "meditative-bliss-states-are-the-opposite-of-reward-hacking",
    order: 10,
  },
  {
    source: "export",
    exportSlug: "some-features-of-a-good-poet",
    outputSlug: "some-features-of-a-good-poet",
    order: 11,
  },
  {
    source: "export",
    exportSlug: "listen-to-this-classical-music-2",
    outputSlug: "listen-to-this-classical-music-2",
    order: 12,
  },
  { source: "export", exportSlug: "negative-space", outputSlug: "negative-space", order: 13 },
  { source: "export", exportSlug: "in-paradisum", outputSlug: "in-paradisum", order: 14 },
]

const unclenchingPosts = [
  "unclenching",
  "harder-better-faster-stronger",
  "fake-it-til-you-make-it",
  "practice",
  "interlude-predictive-coding",
  "who-mistranslates-the-mistranslators",
  "how-steep-was-my-valley",
  "canalization",
  "iron-your-brain",
  "actually",
  "clenching",
]

async function main() {
  const rows = parseCsv(fs.readFileSync(postsCsvPath, "utf8"))
  const postsBySlug = buildPostIndex(rows)

  for (const post of inkhavenPosts) {
    importedSlugToPath.set(post.outputSlug || post.slug, `/series/inkhaven/${post.outputSlug || post.slug}`)
    if (post.exportSlug) importedSlugToPath.set(post.exportSlug, `/series/inkhaven/${post.outputSlug}`)
  }
  for (const slug of unclenchingPosts) {
    importedSlugToPath.set(slug, `/series/unclenching/${slug}`)
  }

  fs.mkdirSync(inkhavenDir, { recursive: true })
  fs.mkdirSync(unclenchingDir, { recursive: true })
  writeInkhavenSeries()
  preserveUnclenchingSeries()

  for (const post of inkhavenPosts) {
    if (post.source === "local") {
      importLocalMarkdown(post)
      continue
    }
    await importExportPost({
      seriesSlug: "inkhaven",
      targetDir: inkhavenDir,
      exportPost: postsBySlug.get(post.exportSlug),
      outputSlug: post.outputSlug,
      order: post.order,
      fallbackTitle: titleFromSlug(post.outputSlug),
      removeOldPath: post.oldPath,
    })
  }

  for (const slug of unclenchingPosts) {
    const stub = readFrontmatter(path.join(projectRoot, "content", "series", "unclenching", `${slug}.md`))
    await importExportPost({
      seriesSlug: "unclenching",
      targetDir: unclenchingDir,
      exportPost: postsBySlug.get(slug),
      outputSlug: slug,
      order: Number(stub.data.order || 999),
      fallbackTitle: stub.data.title || titleFromSlug(slug),
      description: stub.data.description,
      created: stub.data.created,
    })
  }
}

function writeInkhavenSeries() {
  const body = `---\ntitle: Inkhaven\nexcerpt: Posts from the April 2026 Inkhaven residency.\nstatus: finished\ncreated: 2026-04-01\nupdated: 2026-04-30\ntags:\n  - inkhaven\n---\nPosts from April 2026 at Inkhaven.\n`
  fs.writeFileSync(path.join(inkhavenDir, "_series.md"), body)
}

function preserveUnclenchingSeries() {
  const source = path.join(projectRoot, "content", "series", "unclenching", "_series.md")
  const target = path.join(unclenchingDir, "_series.md")
  fs.copyFileSync(source, target)
}

function importLocalMarkdown(post) {
  const target = path.join(inkhavenDir, `${post.slug}.md`)
  if (isImportLocked(target)) return
  if (!fs.existsSync(post.oldPath) && fs.existsSync(target)) return
  const parsed = readFrontmatter(post.oldPath)
  const body = parsed.content.trim()
  writeMarkdown(target, {
    title: post.title,
    order: post.order,
    created: post.created,
    tags: parsed.data.tags || ["inkhaven"],
    body,
  })
  fs.unlinkSync(post.oldPath)
}

async function importExportPost({
  seriesSlug,
  targetDir,
  exportPost,
  outputSlug,
  order,
  fallbackTitle,
  description,
  created,
  removeOldPath,
}) {
  if (!exportPost) throw new Error(`Missing export post for ${outputSlug}`)
  const target = path.join(targetDir, `${outputSlug}.md`)
  if (isImportLocked(target)) return
  const htmlPath = findHtmlForPost(exportPost)
  const html = fs.readFileSync(htmlPath, "utf8")
  const assetDir = path.join(targetDir, "assets", outputSlug)
  const converter = new HtmlConverter({ seriesSlug, postSlug: outputSlug, assetDir })
  const body = await converter.convert(html)
  writeMarkdown(target, {
    title: exportPost.title || fallbackTitle,
    order,
    created: created || dateInZone(exportPost.post_date, "America/Los_Angeles"),
    description: description || exportPost.subtitle || undefined,
    body,
  })
  if (removeOldPath && fs.existsSync(removeOldPath)) fs.unlinkSync(removeOldPath)
}

function isImportLocked(target) {
  if (forceLocked || !fs.existsSync(target)) return false
  const value = readFrontmatter(target).data.import_locked
  return value === true || value === "true" || value === "yes" || value === "1"
}

function writeMarkdown(target, { title, order, created, description, tags, body }) {
  const lines = ["---", `title: ${yamlString(title)}`, `order: ${order}`]
  if (created) lines.push(`created: ${created}`)
  if (description) lines.push(`description: ${yamlString(description)}`)
  if (tags?.length) {
    lines.push("tags:")
    for (const tag of tags) lines.push(`  - ${tag}`)
  }
  lines.push("---", "", body.trim(), "")
  fs.writeFileSync(target, lines.join("\n"))
}

class HtmlConverter {
  constructor({ seriesSlug, postSlug, assetDir }) {
    this.seriesSlug = seriesSlug
    this.postSlug = postSlug
    this.assetDir = assetDir
    this.footnotes = new Map()
    this.downloads = new Map()
  }

  async convert(html) {
    const tree = parse5.parseFragment(html)
    this.collectFootnotes(tree)
    let markdown = await this.renderBlocks(tree.childNodes || [])
    markdown = cleanupMarkdown(markdown)
    const footnotes = [...this.footnotes.entries()]
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([id, content]) => `[^${id}]: ${indentContinuation(content)}`)
      .join("\n\n")
    return cleanupMarkdown(footnotes ? `${markdown}\n\n${footnotes}` : markdown)
  }

  collectFootnotes(node) {
    if (isElement(node, "div") && hasClass(node, "footnote")) {
      const numberNode = findDescendant(node, (child) => hasClass(child, "footnote-number"))
      const contentNode = findDescendant(node, (child) => hasClass(child, "footnote-content"))
      const id = textContent(numberNode).trim()
      if (id && contentNode) {
        this.footnotes.set(id, cleanupMarkdown(this.renderBlocksSync(contentNode.childNodes || [])))
      }
      return
    }
    for (const child of node.childNodes || []) this.collectFootnotes(child)
  }

  async renderBlocks(nodes) {
    const chunks = []
    for (const node of nodes) {
      const rendered = await this.renderBlock(node)
      if (rendered.trim()) chunks.push(rendered.trim())
    }
    return chunks.join("\n\n")
  }

  renderBlocksSync(nodes) {
    const chunks = []
    for (const node of nodes) {
      const rendered = this.renderBlockSync(node)
      if (rendered.trim()) chunks.push(rendered.trim())
    }
    return chunks.join("\n\n")
  }

  async renderBlock(node) {
    if (node.nodeName === "#text") return ""
    if (!node.tagName) return this.renderBlocks(node.childNodes || [])
    if (shouldDropNode(node)) return ""

    switch (node.tagName) {
      case "p":
        return this.renderInline(node).trim()
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return `${headingPrefix(node.tagName)} ${this.renderInline(node).trim()}`
      case "blockquote": {
        const inner = await this.renderBlocks(node.childNodes || [])
        return inner.split("\n").map((line) => (line ? `> ${line}` : ">")).join("\n")
      }
      case "ul":
      case "ol":
        return this.renderList(node)
      case "li":
        return this.renderListItem(node)
      case "hr":
        return "---"
      case "br":
        return "\n"
      case "iframe":
        return this.renderIframe(node)
      case "img":
        return this.renderImage(node)
      case "figure":
        return this.renderFigure(node)
      case "div":
        if (hasClass(node, "youtube-wrap")) return this.renderYouTube(node)
        if (hasOnlyHr(node)) return "---"
        return this.renderBlocks(node.childNodes || [])
      default:
        return this.renderBlocks(node.childNodes || [])
    }
  }

  renderBlockSync(node) {
    if (node.nodeName === "#text") return ""
    if (!node.tagName) return this.renderBlocksSync(node.childNodes || [])
    if (shouldDropNode(node)) return ""
    switch (node.tagName) {
      case "p":
        return this.renderInline(node).trim()
      case "blockquote": {
        const inner = this.renderBlocksSync(node.childNodes || [])
        return inner.split("\n").map((line) => (line ? `> ${line}` : ">")).join("\n")
      }
      case "ul":
      case "ol":
        return this.renderList(node)
      case "hr":
        return "---"
      default:
        return this.renderBlocksSync(node.childNodes || [])
    }
  }

  renderInline(node) {
    return (node.childNodes || [])
      .map((child) => this.renderInlineNode(child))
      .join("")
      .replace(/[ \t]*\n[ \t]*/g, "\n")
      .replace(/[ \t]+<br \/>/g, "<br />")
      .replace(/[ \t]+/g, " ")
  }

  renderInlineNode(node) {
    if (node.nodeName === "#text") return node.value || ""
    if (!node.tagName) return this.renderInline(node)
    if (shouldDropNode(node)) return ""
    if (hasClass(node, "footnote-anchor")) return `[^${textContent(node).trim()}]`

    switch (node.tagName) {
      case "a": {
        const img = findDescendant(node, (child) => isElement(child, "img"))
        if (img) return this.renderImage(img)
        const text = this.renderInline(node).trim()
        const href = rewriteHref(attr(node, "href"))
        return href && text ? `[${escapeLinkText(text)}](${href})` : text
      }
      case "strong":
      case "b":
        return wrapInline(this.renderInline(node), "**")
      case "em":
      case "i":
        return wrapInline(this.renderInline(node), "*")
      case "s":
      case "del":
        return `~~${this.renderInline(node).trim()}~~`
      case "code":
        return `\`${textContent(node).replace(/`/g, "\\`")}\``
      case "br":
        return "<br />\n"
      case "sup":
        return this.renderInline(node).trim()
      case "img":
        return this.renderImage(node)
      default:
        return this.renderInline(node)
    }
  }

  renderList(node) {
    const ordered = node.tagName === "ol"
    return (node.childNodes || [])
      .filter((child) => isElement(child, "li"))
      .map((li, index) => {
        const marker = ordered ? `${index + 1}. ` : "- "
        const item = this.renderListItem(li)
        return marker + item.replace(/\n/g, "\n  ")
      })
      .join("\n")
  }

  renderListItem(node) {
    return cleanupMarkdown(this.renderBlocksSync(node.childNodes || []) || this.renderInline(node)).replace(/\n\n/g, "\n")
  }

  renderFigure(node) {
    const img = findDescendant(node, (child) => isElement(child, "img"))
    if (!img) return this.renderBlocksSync(node.childNodes || [])
    const image = this.renderImage(img)
    const caption = findDescendant(node, (child) => isElement(child, "figcaption"))
    const captionText = caption ? this.renderInline(caption).trim() : ""
    return captionText ? `${image}\n\n*${captionText}*` : image
  }

  renderImage(node) {
    const src = imageSrc(node)
    if (!src) return ""
    const localSrc = this.localImage(src)
    const alt = attr(node, "alt") || ""
    return `![${escapeLinkText(alt)}](${localSrc})`
  }

  renderIframe(node) {
    const src = attr(node, "src")
    const attrs = jsonAttr(node, "data-attrs") || {}
    if (src?.includes("open.spotify.com/embed/")) {
      return `::spotify-embed{src="${escapeDirectiveAttr(src)}" title="${escapeDirectiveAttr(attrs.title || "Spotify embed")}"}`
    }
    if (src?.includes("youtube")) {
      return `::youtube-embed{src="${escapeDirectiveAttr(src)}" title="YouTube embed"}`
    }
    return src ? `[Embedded media](${src})` : ""
  }

  renderYouTube(node) {
    const iframe = findDescendant(node, (child) => isElement(child, "iframe"))
    return iframe ? this.renderIframe(iframe) : ""
  }

  localImage(src) {
    const source = normalizeImageUrl(src)
    if (this.downloads.has(source)) return this.downloads.get(source)
    fs.mkdirSync(this.assetDir, { recursive: true })
    const filename = uniqueFilename(this.assetDir, source)
    const target = path.join(this.assetDir, filename)
    this.downloads.set(source, `/series/${this.seriesSlug}/assets/${this.postSlug}/${filename}`)
    pendingDownloads.push(downloadFile(source, target))
    return this.downloads.get(source)
  }
}

const pendingDownloads = []

async function downloadFile(url, target) {
  if (fs.existsSync(target)) return
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(target, buffer)
}

const originalConvert = HtmlConverter.prototype.convert
HtmlConverter.prototype.convert = async function convertAndWait(html) {
  const result = await originalConvert.call(this, html)
  await Promise.all(pendingDownloads.splice(0))
  return result
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

function findHtmlForPost(post) {
  const file = fs.readdirSync(postsDir).find((name) => name.startsWith(`${post.numericId}.`) && name.endsWith(".html"))
  if (!file) throw new Error(`Missing HTML for ${post.post_id}`)
  return path.join(postsDir, file)
}

function buildPostIndex(rows) {
  const index = new Map()
  for (const row of rows) {
    if (!row.post_id) continue
    const [numericId, ...slugParts] = row.post_id.split(".")
    const slug = slugParts.join(".")
    const post = { ...row, numericId, slug }
    const existing = index.get(slug)
    if (!existing || preferPost(post, existing)) index.set(slug, post)
  }
  return index
}

function preferPost(candidate, current) {
  if (candidate.is_published !== current.is_published) return candidate.is_published === "true"
  if (Boolean(candidate.title) !== Boolean(current.title)) return Boolean(candidate.title)
  return new Date(candidate.post_date || 0) > new Date(current.post_date || 0)
}

function parseCsv(csv) {
  const rows = []
  const lines = csv.trim().split(/\r?\n/)
  const headers = splitCsvLine(lines.shift())
  for (const line of lines) {
    const values = splitCsvLine(line)
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
  }
  return rows
}

function splitCsvLine(line) {
  const values = []
  let value = ""
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' && quoted && line[i + 1] === '"') {
      value += '"'
      i++
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === "," && !quoted) {
      values.push(value)
      value = ""
    } else {
      value += char
    }
  }
  values.push(value)
  return values
}

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8")
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const data = {}
  const lines = match[1].split("\n")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const scalar = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!scalar) continue
    const [, key, value] = scalar
    if (value) {
      data[key] = value.replace(/^["']|["']$/g, "")
      continue
    }
    const list = []
    while (lines[i + 1]?.match(/^\s+-\s+/)) {
      i++
      list.push(lines[i].replace(/^\s+-\s+/, ""))
    }
    data[key] = list.length ? list : ""
  }
  return { data, content: match[2] }
}

function attr(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value || ""
}

function jsonAttr(node, name) {
  const raw = attr(node, name)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function imageSrc(node) {
  const attrs = jsonAttr(node, "data-attrs")
  return attrs?.src || attr(node, "src")
}

function normalizeImageUrl(src) {
  if (src.includes("substackcdn.com/image/fetch/")) {
    const match = src.match(/https%3A%2F%2F.+$/)
    if (match) return decodeURIComponent(match[0])
  }
  return src
}

function uniqueFilename(dir, source) {
  const url = new URL(source)
  const basename = path.basename(url.pathname).replace(/[^A-Za-z0-9._-]/g, "-") || "image"
  return path.extname(basename) ? basename : `${basename}.jpg`
}

function rewriteHref(href) {
  if (!href) return ""
  if (href.startsWith("#")) return href
  try {
    const url = new URL(href, "https://www.robustenough.com")
    if (["www.robustenough.com", "robustenough.com", "robustenough.substack.com"].includes(url.hostname)) {
      const match = url.pathname.match(/^\/p\/([^/]+)/)
      if (match) return importedSlugToPath.get(match[1]) || `https://www.robustenough.com/p/${match[1]}`
    }
  } catch {
    return href
  }
  return href
}

function isElement(node, tagName) {
  return node?.tagName === tagName
}

function hasClass(node, className) {
  return attr(node, "class").split(/\s+/).includes(className)
}

function hasOnlyHr(node) {
  const children = (node.childNodes || []).filter((child) => child.nodeName !== "#text" || child.value.trim())
  return children.length === 1 && isElement(children[0], "hr")
}

function shouldDropNode(node) {
  return (
    hasClass(node, "subscription-widget-wrap-editor") ||
    hasClass(node, "subscription-widget") ||
    hasClass(node, "button-wrapper") ||
    hasClass(node, "image-link-expand") ||
    hasClass(node, "footnote") ||
    hasClass(node, "footnote-number") ||
    ["script", "style", "source", "button", "form", "input"].includes(node.tagName)
  )
}

function findDescendant(node, predicate) {
  for (const child of node.childNodes || []) {
    if (predicate(child)) return child
    const found = findDescendant(child, predicate)
    if (found) return found
  }
  return null
}

function textContent(node) {
  if (!node) return ""
  if (node.nodeName === "#text") return node.value || ""
  return (node.childNodes || []).map(textContent).join("")
}

function headingPrefix(tagName) {
  if (tagName === "h1") return "##"
  if (tagName === "h5" || tagName === "h6") return "###"
  return "##"
}

function cleanupMarkdown(markdown) {
  return markdown
    .replace(/([a-z0-9”’)])\.([A-Z])/g, "$1. $2")
    .replace(/(\d\))([a-z])/g, "$1 $2")
    .replace(/(\)):(?=[A-Za-z])/g, "$1\\:")
    .replace(/\[\^([^\]]+)\]\*\*/g, "**[^$1]")
    .replace(/\[\^([^\]]+)\]\*/g, "*[^$1]")
    .replace(/\blocalrule\b/g, "local rule")
    .replace(/\banddistilled\b/g, "and distilled")
    .replace(/\bdownhilltogether\b/g, "downhill together")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(?:\n---\n){2,}/g, "\n---\n")
    .replace(/\n\n---\n\n(?=\[\^[^\]]+\]:)/g, "\n\n")
    .replace(/(?:^|\n\n)---\s*$/g, "")
    .replace(/^\s+|\s+$/g, "")
}

function indentContinuation(content) {
  return content.replace(/\n/g, "\n    ")
}

function escapeLinkText(text) {
  return text.replace(/\[/g, "\\[").replace(/\]/g, "\\]")
}

function escapeDirectiveAttr(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/"/g, "&quot;")
}

function wrapInline(text, marker) {
  const leading = text.match(/^\s*/)?.[0] || ""
  const trailing = text.match(/\s*$/)?.[0] || ""
  const inner = text.trim()
  if (!inner) return text
  if (/^[.,!?;:]+$/.test(inner)) return `${leading}${inner}${trailing}`
  return `${leading}${marker}${inner}${marker}${trailing}`
}

function yamlString(value) {
  return JSON.stringify(String(value))
}

function titleFromSlug(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function dateInZone(iso, timeZone) {
  if (!iso) return undefined
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}
