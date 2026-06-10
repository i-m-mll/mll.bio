import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkHtml from 'remark-html'
import { visit } from 'unist-util-visit'
import lunr from 'lunr'
import { escapeHtml, sanitizeHtml } from '../lib/html-sanitizer.mjs'
import { collectFiles, hashFiles, outputsExist, pathExists, readJson, writeJson } from './generation-cache.mjs'

const postsDirectory = path.join(process.cwd(), 'content/posts')
const seriesDirectory = path.join(process.cwd(), 'content/series')
const outputDir = path.join(process.cwd(), 'public', 'search')
const outputPath = path.join(outputDir, 'index.json')
const cachePath = path.join(process.cwd(), 'generated', '.cache', 'search-index.json')

const MAX_SNIPPET_LINES = Number(process.env.SNIPPET_CODE_LINES) || 7

function isMarkdownFile(fileName) {
  return fileName.endsWith('.md') || fileName.endsWith('.mdx')
}

function isDirectory(fullPath) {
  try {
    return fs.statSync(fullPath).isDirectory()
  } catch {
    return false
  }
}

function getBlogPostFiles() {
  if (!fs.existsSync(postsDirectory)) return []

  const entries = fs.readdirSync(postsDirectory, { withFileTypes: true })
  const postFiles = []

  entries.forEach((entry) => {
    const entryPath = path.join(postsDirectory, entry.name)
    if (isDirectory(entryPath)) {
      const mdxPath = path.join(entryPath, `${entry.name}.mdx`)
      const mdPath = path.join(entryPath, `${entry.name}.md`)
      if (fs.existsSync(mdxPath)) {
        postFiles.push({ slug: entry.name, fullPath: mdxPath })
      } else if (fs.existsSync(mdPath)) {
        postFiles.push({ slug: entry.name, fullPath: mdPath })
      }
    } else if (isMarkdownFile(entry.name)) {
      postFiles.push({
        slug: entry.name.replace(/\.mdx?$/, ''),
        fullPath: entryPath,
      })
    }
  })

  return postFiles
}

function getSeriesSlugs() {
  if (!fs.existsSync(seriesDirectory)) return []

  return fs.readdirSync(seriesDirectory, { withFileTypes: true })
    .filter(entry => isDirectory(path.join(seriesDirectory, entry.name)))
    .map(entry => entry.name)
}

function readSeriesConfig(seriesPath) {
  const mdPath = path.join(seriesPath, '_series.md')
  if (fs.existsSync(mdPath)) {
    const raw = fs.readFileSync(mdPath, 'utf8')
    const { data, content } = matter(raw)
    return {
      ...data,
      descriptionContent: content.trim() || undefined,
    }
  }

  const jsonPath = path.join(seriesPath, '_series.json')
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  }

  return null
}

/**
 * Strip remark-directive syntax from a markdown snippet for display/indexing.
 * Container/leaf directive fence lines (::name, :::name) are removed.
 * Inline text directives (:name[content]{attrs}) are replaced with just their content.
 * Block counts and offsets are NOT affected — this is only applied to display text.
 */
function stripDirectives(md) {
  // Remove container/leaf directive fence lines (lines starting with 2+ colons)
  let result = md.replace(/^:{2,}[^\n]*$/gm, '')
  // Replace inline text directives :name[content]{attrs} or :name[content] with just content
  result = result.replace(/:[\w-]+\[([^\]]*)\](?:\{[^}]*\})?/g, '$1')
  // Remove remaining bare inline directives :name{attrs} or :name
  result = result.replace(/:[\w-]+(?:\{[^}]*\})?/g, '')
  return result
}

function mdToHtml(md) {
  return sanitizeHtml(String(unified().use(remarkParse).use(remarkMdx).use(remarkHtml).processSync(md)))
}

function getBlocks(markdown) {
  // Try MDX parsing first, fall back to plain markdown if it fails
  let tree
  try {
    tree = unified().use(remarkParse).use(remarkMdx, {skipExport: true}).parse(markdown)
  } catch {
    // MDX parsing failed (e.g., due to KaTeX/math content), fall back to plain markdown
    try {
      tree = unified().use(remarkParse).parse(markdown)
    } catch {
      // Even plain markdown failed, return empty blocks
      return []
    }
  }

  const blocks = []
  visit(tree, (node) => {
    const types = ['paragraph', 'heading', 'listItem', 'code', 'blockquote']
    if (!types.includes(node.type)) return
    if (!node.position || typeof node.position.start.offset !== 'number' || typeof node.position.end.offset !== 'number') return
    const { start, end } = node.position
    const slice = markdown.slice(start.offset, end.offset)

    let mdSnippet = slice
    let plainForIndex

    if (node.type === 'code') {
      const lines = slice.split('\n')
      if (lines.length > MAX_SNIPPET_LINES) {
        mdSnippet = lines.slice(0, MAX_SNIPPET_LINES).join('\n') + '\n...'
      }
      plainForIndex = lines.filter(l => !l.trim().startsWith('```')).join(' ')
    } else {
      // For non-code blocks, strip directive syntax before generating display text
      const cleanSnippet = stripDirectives(mdSnippet)
      plainForIndex = cleanSnippet
      mdSnippet = cleanSnippet
    }

    let htmlSnippet
    try {
      htmlSnippet = mdToHtml(mdSnippet)
    } catch {
      // HTML conversion failed, use raw text
      htmlSnippet = `<p>${escapeHtml(mdSnippet)}</p>`
    }
    const plain = node.type === 'code' ? plainForIndex : htmlSnippet.replace(/<[^>]+>/g, ' ')
    const isCode = node.type === 'code'
    const lang = isCode ? (node.lang || '') : ''

    blocks.push({ htmlSnippet, plain, isCode, codeText: isCode ? slice : null, lang })
  })
  return blocks
}

function buildIndex() {
  const allDocs = []
  const store = {}

  // Index blog posts
  getBlogPostFiles().forEach(({ slug, fullPath }) => {
    // Read file and strip YAML front-matter so it does not get indexed as regular text
    const raw = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(raw)
    if (data.draft) return
    if (data.externalUrl) return
    const title = data.title || slug
    // Only index the actual Markdown body (content) – excludes front-matter
    const blocks = getBlocks(content)
    blocks.forEach((block, idx) => {
      const id = `${slug}::${idx}`
      allDocs.push({ id, title, content: block.plain, slug, url: `/blog/${slug}` })
      store[id] = { title, slug, url: `/blog/${slug}`, snippetHtml: block.htmlSnippet, isCode: block.isCode, codeText: block.codeText, lang: block.lang }
    })
  })

  // Index series posts
  getSeriesSlugs().forEach((seriesSlug) => {
    const seriesPath = path.join(seriesDirectory, seriesSlug)

    // Read series config for the series title
    let seriesTitle = seriesSlug
    const config = readSeriesConfig(seriesPath)
    if (config?.draft) return
    if (config) seriesTitle = config.title || seriesSlug

    const files = fs.readdirSync(seriesPath)
    files.forEach((fileName) => {
      if (!isMarkdownFile(fileName)) return
      if (fileName.startsWith('_')) return // Skip config files

      const postSlug = fileName.replace(/\.mdx?$/, '')
      const fullPath = path.join(seriesPath, fileName)
      const raw = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(raw)
      if (data.draft) return
      if (data.externalUrl) return

      const title = data.title || postSlug
      const fullTitle = `${title} (${seriesTitle})`
      const url = `/series/${seriesSlug}/${postSlug}`

      const blocks = getBlocks(content)
      blocks.forEach((block, idx) => {
        const id = `series-${seriesSlug}-${postSlug}::${idx}`
        allDocs.push({ id, title: fullTitle, content: block.plain, slug: postSlug, url })
        store[id] = { title: fullTitle, slug: postSlug, url, snippetHtml: block.htmlSnippet, isCode: block.isCode, codeText: block.codeText, lang: block.lang }
      })
    })
  })

  if (allDocs.length === 0) return { index: null, store: {} }

  const idx = lunr(function () {
    this.ref('id')
    this.field('title', { boost: 10 })
    this.field('content')
    this.metadataWhitelist = ['position']
    allDocs.forEach((d) => this.add(d))
  })

  return { index: idx, store }
}

async function getSearchInputs() {
  const markdown = (_, fileName) => isMarkdownFile(fileName)
  const [postFiles, seriesFiles] = await Promise.all([
    collectFiles(postsDirectory, markdown),
    collectFiles(seriesDirectory, markdown),
  ])
  return [...postFiles, ...seriesFiles]
}

async function canSkip() {
  if (!(await pathExists(cachePath))) return false

  const inputFiles = await getSearchInputs()
  const signature = await hashFiles(inputFiles, 'search-index:v1')
  const cached = await readJson(cachePath)

  return cached.signature === signature && await outputsExist([outputPath])
}

async function main() {
  if (await canSkip()) {
    console.log('Search index unchanged; skipping generation')
    return
  }

  const { index, store } = buildIndex()
  if (!index) {
    console.log('No documents found, skipping index')
    return
  }
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify({ index, store }))
  await writeJson(cachePath, {
    signature: await hashFiles(await getSearchInputs(), 'search-index:v1'),
    snippets: Object.keys(store).length,
  })
  console.log(`Search index generated with ${Object.keys(store).length} snippets`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
