import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { siteConfig } from "@/lib/config/site"

export interface SeriesPost {
  slug: string
  content: string
  filePath?: string // Relative path to the file (for diff tools)
  readingTime: string // Computed reading time (e.g., "5 min read")
  frontmatter: {
    title: string
    order: number
    created?: string      // Formatted date for display
    createdRaw?: string   // ISO date for sorting/inference
    updated?: string      // Formatted date for display
    updatedRaw?: string   // ISO date for sorting/inference
    description?: string
    draft?: boolean
  }
}

export interface Series {
  slug: string
  title: string
  description: string
  posts: SeriesPost[]
  // Metadata - can be specified in config or inferred from posts
  status?: string
  epistemic?: string
  created?: string      // Formatted date for display
  createdRaw?: string   // ISO date for sorting
  updated?: string      // Formatted date for display
  updatedRaw?: string   // ISO date for sorting
  tags?: string[]
}

export interface SeriesConfig {
  title: string
  description: string
  order?: number // For ordering series in a list
  // Optional metadata - if not specified, dates are inferred from posts
  status?: string
  epistemic?: string
  created?: string  // ISO date string
  updated?: string  // ISO date string
  tags?: string[]
}

const seriesDirectory = path.join(process.cwd(), "content/series")

// Helper function to calculate reading time (excludes code blocks)
function calculateReadingTime(content: string): string {
  const { wordsPerMinute } = siteConfig.readingTime
  // Remove fenced code blocks before counting words
  const proseOnly = content.replace(/```[\s\S]*?```/g, '')
  const words = proseOnly.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}

// Helper function to format date to "24 May 2025"
function formatDate(dateInput: string | Date): string {
  const date = new Date(dateInput)
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

/**
 * Get the series config from _series.json in the series directory
 */
function getSeriesConfig(seriesSlug: string): SeriesConfig | null {
  const configPath = path.join(seriesDirectory, seriesSlug, "_series.json")
  if (!fs.existsSync(configPath)) {
    return null
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf8")
    return JSON.parse(configContent) as SeriesConfig
  } catch {
    return null
  }
}

/**
 * Get all series slugs
 */
export async function getSeriesSlugs(): Promise<string[]> {
  if (!fs.existsSync(seriesDirectory)) {
    return []
  }

  const entries = fs.readdirSync(seriesDirectory, { withFileTypes: true })
  return entries
    .filter(entry => {
      // Use statSync (follows symlinks) instead of entry.isDirectory() (lstat, skips symlinked dirs)
      // Bug: f886345 — Dirent.isDirectory() does not follow symlinks
      try {
        return fs.statSync(path.join(seriesDirectory, entry.name)).isDirectory()
      } catch {
        return false
      }
    })
    .map(entry => entry.name)
}

/**
 * Get all posts in a series, sorted by order
 */
export async function getSeriesPosts(seriesSlug: string): Promise<SeriesPost[]> {
  const seriesPath = path.join(seriesDirectory, seriesSlug)

  if (!fs.existsSync(seriesPath)) {
    return []
  }

  const fileNames = fs.readdirSync(seriesPath)

  const posts = fileNames
    .filter(fileName => {
      // Only include .md and .mdx files, exclude _series.json
      return (fileName.endsWith(".md") || fileName.endsWith(".mdx")) && !fileName.startsWith("_")
    })
    .map(fileName => {
      const slug = fileName.replace(/\.mdx?$/, "")
      const fullPath = path.join(seriesPath, fileName)
      const fileContents = fs.readFileSync(fullPath, "utf8")

      const { data, content } = matter(fileContents)

      // Store raw dates for inference, format for display
      const createdRaw = data.created ? new Date(data.created).toISOString() : undefined
      const updatedRaw = data.updated ? new Date(data.updated).toISOString() : undefined

      return {
        slug,
        content,
        readingTime: calculateReadingTime(content),
        frontmatter: {
          title: data.title || slug,
          order: data.order ?? 999,
          created: data.created ? formatDate(data.created) : undefined,
          createdRaw,
          updated: data.updated ? formatDate(data.updated) : undefined,
          updatedRaw,
          description: data.description || "",
          draft: data.draft || false,
        },
      }
    })
    // Filter out draft posts
    .filter(post => !post.frontmatter.draft)
    // Sort by order
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order)

  return posts
}

/**
 * Get a specific post from a series
 */
export async function getSeriesPost(seriesSlug: string, postSlug: string): Promise<SeriesPost | null> {
  const seriesPath = path.join(seriesDirectory, seriesSlug)

  // Try .mdx first, then .md
  let fullPath = path.join(seriesPath, `${postSlug}.mdx`)
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(seriesPath, `${postSlug}.md`)
    if (!fs.existsSync(fullPath)) {
      return null
    }
  }

  try {
    const fileContents = fs.readFileSync(fullPath, "utf8")
    const { data, content } = matter(fileContents)

    // Don't return draft posts
    if (data.draft) {
      return null
    }

    const createdRaw = data.created ? new Date(data.created).toISOString() : undefined
    const updatedRaw = data.updated ? new Date(data.updated).toISOString() : undefined

    // Get relative file path from project root for diff tools
    const relativeFilePath = path.relative(process.cwd(), fullPath)

    return {
      slug: postSlug,
      content,
      filePath: relativeFilePath,
      readingTime: calculateReadingTime(content),
      frontmatter: {
        title: data.title || postSlug,
        order: data.order ?? 999,
        created: data.created ? formatDate(data.created) : undefined,
        createdRaw,
        updated: data.updated ? formatDate(data.updated) : undefined,
        updatedRaw,
        description: data.description || "",
        draft: data.draft || false,
      },
    }
  } catch {
    return null
  }
}

/**
 * Infer series dates from posts if not specified in config
 */
function inferSeriesDates(posts: SeriesPost[], config: SeriesConfig): {
  created?: string
  createdRaw?: string
  updated?: string
  updatedRaw?: string
} {
  // If config specifies dates, use those
  if (config.created && config.updated) {
    return {
      created: formatDate(config.created),
      createdRaw: new Date(config.created).toISOString(),
      updated: formatDate(config.updated),
      updatedRaw: new Date(config.updated).toISOString(),
    }
  }

  // Collect all dates from posts
  const allCreatedDates: Date[] = []
  const allUpdatedDates: Date[] = []

  for (const post of posts) {
    if (post.frontmatter.createdRaw) {
      allCreatedDates.push(new Date(post.frontmatter.createdRaw))
    }
    if (post.frontmatter.updatedRaw) {
      allUpdatedDates.push(new Date(post.frontmatter.updatedRaw))
    } else if (post.frontmatter.createdRaw) {
      // If no updated date, use created date
      allUpdatedDates.push(new Date(post.frontmatter.createdRaw))
    }
  }

  // Infer created: use config value or earliest post created date
  let createdDate: Date | undefined
  if (config.created) {
    createdDate = new Date(config.created)
  } else if (allCreatedDates.length > 0) {
    createdDate = new Date(Math.min(...allCreatedDates.map(d => d.getTime())))
  }

  // Infer updated: use config value or latest post updated/created date
  let updatedDate: Date | undefined
  if (config.updated) {
    updatedDate = new Date(config.updated)
  } else if (allUpdatedDates.length > 0) {
    updatedDate = new Date(Math.max(...allUpdatedDates.map(d => d.getTime())))
  }

  return {
    created: createdDate ? formatDate(createdDate) : undefined,
    createdRaw: createdDate ? createdDate.toISOString() : undefined,
    updated: updatedDate ? formatDate(updatedDate) : undefined,
    updatedRaw: updatedDate ? updatedDate.toISOString() : undefined,
  }
}

/**
 * Get a complete series with config and posts
 */
export async function getSeries(seriesSlug: string): Promise<Series | null> {
  const config = getSeriesConfig(seriesSlug)
  if (!config) {
    return null
  }

  const posts = await getSeriesPosts(seriesSlug)

  // Infer dates from posts if not specified
  const dates = inferSeriesDates(posts, config)

  return {
    slug: seriesSlug,
    title: config.title,
    description: config.description,
    posts,
    // Metadata from config
    status: config.status,
    epistemic: config.epistemic,
    tags: config.tags,
    // Dates - from config or inferred from posts
    ...dates,
  }
}

/**
 * Get all series with their configs and posts
 */
export async function getAllSeries(): Promise<Series[]> {
  const slugs = await getSeriesSlugs()
  const seriesList: Series[] = []

  for (const slug of slugs) {
    const series = await getSeries(slug)
    if (series) {
      seriesList.push(series)
    }
  }

  return seriesList
}
