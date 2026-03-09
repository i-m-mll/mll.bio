import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkHtml from 'remark-html'
import { visit } from 'unist-util-visit'
import lunr from 'lunr'

const postsDirectory = path.join(process.cwd(), 'content/posts')
const seriesDirectory = path.join(process.cwd(), 'content/series')
const outputDir = path.join(process.cwd(), 'public', 'search')
const outputPath = path.join(outputDir, 'index.json')

const MAX_SNIPPET_LINES = Number(process.env.SNIPPET_CODE_LINES) || 7

function mdToHtml(md) {
  return String(unified().use(remarkParse).use(remarkMdx).use(remarkHtml).processSync(md))
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
      plainForIndex = mdSnippet
    }

    let htmlSnippet
    try {
      htmlSnippet = mdToHtml(mdSnippet)
    } catch {
      // HTML conversion failed, use raw text
      htmlSnippet = `<p>${mdSnippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
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
  if (fs.existsSync(postsDirectory)) {
    const files = fs.readdirSync(postsDirectory)
    files.forEach((fileName) => {
      if (!fileName.endsWith('.md') && !fileName.endsWith('.mdx')) return
      const slug = fileName.replace(/\.mdx?$/, '')
      const fullPath = path.join(postsDirectory, fileName)
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
  }

  // Index series posts
  if (fs.existsSync(seriesDirectory)) {
    const seriesFolders = fs.readdirSync(seriesDirectory, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)

    seriesFolders.forEach((seriesSlug) => {
      const seriesPath = path.join(seriesDirectory, seriesSlug)

      // Read series config for the series title
      let seriesTitle = seriesSlug
      const configPath = path.join(seriesPath, '_series.json')
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
          seriesTitle = config.title || seriesSlug
        } catch {}
      }

      const files = fs.readdirSync(seriesPath)
      files.forEach((fileName) => {
        if (!fileName.endsWith('.md') && !fileName.endsWith('.mdx')) return
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
  }

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

function main() {
  const { index, store } = buildIndex()
  if (!index) {
    console.log('No documents found, skipping index')
    return
  }
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify({ index, store }))
  console.log(`Search index generated with ${Object.keys(store).length} snippets`)
}

main() 