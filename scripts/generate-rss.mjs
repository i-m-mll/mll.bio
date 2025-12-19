/**
 * Generates RSS feed (feed.xml) from blog posts and series
 * Run during build via npm scripts
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// Site configuration
const SITE_URL = 'https://mll.bio'
const SITE_TITLE = 'MLL'
const SITE_DESCRIPTION = 'Personal website and blog'
const AUTHOR = 'MLL'

// Directories
const POSTS_DIR = path.join(process.cwd(), 'content/posts')
const SERIES_DIR = path.join(process.cwd(), 'content/series')
const OUTPUT_PATH = path.join(process.cwd(), 'public/feed.xml')

/**
 * Get all blog posts
 */
function getBlogPosts() {
  if (!fs.existsSync(POSTS_DIR)) return []

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx'))

  return files.map(file => {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
    const { data } = matter(content)

    if (data.draft) return null

    const slug = file.replace(/\.mdx?$/, '')
    const publishedDate = data.published || data.date || new Date().toISOString()

    return {
      title: data.title || slug,
      description: data.description || '',
      url: `${SITE_URL}/blog/${slug}`,
      date: new Date(publishedDate),
      type: 'post'
    }
  }).filter(Boolean)
}

/**
 * Get all series posts
 */
function getSeriesPosts() {
  if (!fs.existsSync(SERIES_DIR)) return []

  const seriesDirs = fs.readdirSync(SERIES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  const posts = []

  for (const seriesSlug of seriesDirs) {
    const seriesPath = path.join(SERIES_DIR, seriesSlug)
    const configPath = path.join(seriesPath, '_series.json')

    if (!fs.existsSync(configPath)) continue

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    if (config.draft) continue

    const files = fs.readdirSync(seriesPath).filter(f => f.endsWith('.md') || f.endsWith('.mdx'))

    for (const file of files) {
      const content = fs.readFileSync(path.join(seriesPath, file), 'utf-8')
      const { data } = matter(content)

      if (data.draft) continue

      const slug = file.replace(/\.mdx?$/, '')
      const createdDate = data.created || new Date().toISOString()

      posts.push({
        title: `${data.title || slug} (${config.title})`,
        description: data.description || config.description || '',
        url: `${SITE_URL}/series/${seriesSlug}/${slug}`,
        date: new Date(createdDate),
        type: 'series'
      })
    }
  }

  return posts
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Format date for RSS (RFC 822)
 */
function formatRssDate(date) {
  return date.toUTCString()
}

/**
 * Generate RSS XML
 */
function generateRss(items) {
  // Sort by date (newest first)
  items.sort((a, b) => b.date.getTime() - a.date.getTime())

  // Take most recent 50 items
  const recentItems = items.slice(0, 50)

  const itemsXml = recentItems.map(item => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <pubDate>${formatRssDate(item.date)}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`).join('\n')

  const lastBuildDate = recentItems.length > 0
    ? formatRssDate(recentItems[0].date)
    : formatRssDate(new Date())

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <managingEditor>${AUTHOR}</managingEditor>
    <webMaster>${AUTHOR}</webMaster>
${itemsXml}
  </channel>
</rss>`
}

// Main
console.log('Generating RSS feed...')

const blogPosts = getBlogPosts()
const seriesPosts = getSeriesPosts()
const allItems = [...blogPosts, ...seriesPosts]

console.log(`  Found ${blogPosts.length} blog posts`)
console.log(`  Found ${seriesPosts.length} series posts`)

const rss = generateRss(allItems)
fs.writeFileSync(OUTPUT_PATH, rss)

console.log(`  Generated ${OUTPUT_PATH}`)
