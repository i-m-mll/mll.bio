import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { cache } from "react"
import { siteConfig } from "@/lib/config/site"
import {
  contentDateISOString,
  contentPath,
  formatContentDate,
  warnContentDiagnostic,
} from "@/lib/content"

export interface SeriesPost {
  slug: string
  content: string
  filePath?: string // Relative path to the file (for diff tools)
  readingTime: string // Computed reading time (e.g., "5 min read")
  externalUrl?: string // If set, post links out to this URL instead of an internal route
  frontmatter: {
    title: string
    order: number
    created?: string      // Formatted date for display
    createdRaw?: string   // ISO date for sorting/inference
    updated?: string      // Formatted date for display
    updatedRaw?: string   // ISO date for sorting/inference
    description?: string
    draft?: boolean
    tags?: string[]
    ogImage?: string      // Open Graph image URL or path relative to site root
  }
}

export interface Series {
  slug: string
  title: string
  draft?: boolean           // If true, series is hidden from public listings
  excerpt?: string          // Short plain-text/inline-markdown summary (from frontmatter)
  descriptionContent?: string // Full markdown body of _series.md (for rich rendering)
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
  draft?: boolean           // If true, series is hidden from public listings
  excerpt?: string          // Short plain-text/inline-markdown summary (frontmatter field)
  descriptionContent?: string // Full markdown body of _series.md
  order?: number // For ordering series in a list
  // Optional metadata - if not specified, dates are inferred from posts
  status?: string
  epistemic?: string
  created?: string  // ISO date string
  updated?: string  // ISO date string
  tags?: string[]
}

type Frontmatter = Record<string, unknown>

const seriesDirectory = path.join(process.cwd(), "content/series")

const seriesConfigFrontmatterKeys = new Set([
  "title",
  "draft",
  "excerpt",
  "order",
  "status",
  "epistemic",
  "created",
  "updated",
  "tags",
])

const seriesPostFrontmatterKeys = new Set([
  "title",
  "order",
  "created",
  "updated",
  "description",
  "draft",
  "tags",
  "ogImage",
  "externalUrl",
])

function describeSeries(seriesSlug: string, fullPath?: string): string {
  return fullPath
    ? `series "${seriesSlug}" (${contentPath(fullPath)})`
    : `series "${seriesSlug}"`
}

function describeSeriesPost(seriesSlug: string, postSlug: string, fullPath: string): string {
  return `series post "${seriesSlug}/${postSlug}" (${contentPath(fullPath)})`
}

function warnUnknownKeys(data: Frontmatter, allowedKeys: Set<string>, context: string): void {
  for (const key of Object.keys(data)) {
    if (!allowedKeys.has(key)) {
      warnContentDiagnostic(`${context} has unknown frontmatter key "${key}"`)
    }
  }
}

function optionalString(data: Frontmatter, key: string, context: string): string | undefined {
  const value = data[key]
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === "string") {
    return value
  }
  warnContentDiagnostic(`${context} frontmatter key "${key}" must be a string; ignoring it`)
  return undefined
}

function optionalBoolean(
  data: Frontmatter,
  key: string,
  context: string,
  defaultValue: boolean,
): boolean {
  const value = data[key]
  if (value === undefined || value === null) {
    return defaultValue
  }
  if (typeof value === "boolean") {
    return value
  }
  warnContentDiagnostic(`${context} frontmatter key "${key}" must be a boolean; using default`)
  return defaultValue
}

function optionalNumber(data: Frontmatter, key: string, context: string): number | undefined {
  const value = data[key]
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  warnContentDiagnostic(`${context} frontmatter key "${key}" must be a number; ignoring it`)
  return undefined
}

function normalizeTags(tagsInput: unknown, context: string): string[] | undefined {
  if (tagsInput === undefined || tagsInput === null) {
    return undefined
  }

  if (Array.isArray(tagsInput)) {
    const tags = tagsInput
      .filter((tag): tag is string => {
        const valid = typeof tag === "string"
        if (!valid) {
          warnContentDiagnostic(`${context} has a non-string tag; ignoring it`)
        }
        return valid
      })
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    return tags.length > 0 ? tags : undefined
  }

  if (typeof tagsInput === "string") {
    const tags = tagsInput
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    return tags.length > 0 ? tags : undefined
  }

  warnContentDiagnostic(`${context} frontmatter key "tags" must be a string or string array; ignoring it`)
  return undefined
}

function normalizedDate(
  data: Frontmatter,
  key: string,
  context: string,
): { formatted?: string; raw?: string } {
  const value = data[key]
  if (value === undefined || value === null) {
    return {}
  }
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) {
    warnContentDiagnostic(`${context} frontmatter key "${key}" must be a valid date; ignoring it`)
    return {}
  }

  const raw = contentDateISOString(value) ?? undefined
  const formatted = formatContentDate(value) ?? undefined
  if (!raw || !formatted) {
    warnContentDiagnostic(`${context} has invalid "${key}" frontmatter; ignoring it`)
    return {}
  }

  return { formatted, raw }
}

// Helper function to calculate reading time (excludes code blocks)
function calculateReadingTime(content: string): string {
  const { wordsPerMinute } = siteConfig.readingTime
  // Remove fenced code blocks before counting words
  const proseOnly = content.replace(/```[\s\S]*?```/g, "")
  const words = proseOnly.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute))
  return `${minutes} min read`
}

function safeStat(fullPath: string): fs.Stats | null {
  try {
    return fs.statSync(fullPath)
  } catch (error) {
    warnContentDiagnostic(`Unable to stat ${contentPath(fullPath)}; skipping`, error)
    return null
  }
}

function safeReadFile(fullPath: string, context: string): string | null {
  try {
    return fs.readFileSync(fullPath, "utf8")
  } catch (error) {
    warnContentDiagnostic(`Unable to read ${context} at ${contentPath(fullPath)}; skipping`, error)
    return null
  }
}

function safeReadDir(fullPath: string, context: string): string[] {
  try {
    return fs.readdirSync(fullPath)
  } catch (error) {
    warnContentDiagnostic(`Unable to read ${context} at ${contentPath(fullPath)}; skipping`, error)
    return []
  }
}

function findFirstExistingFile(candidates: string[]): string | null {
  for (const candidate of candidates) {
    try {
      const stat = fs.lstatSync(candidate)
      if (stat.isFile() || stat.isSymbolicLink()) {
        return candidate
      }
    } catch {
      // Missing candidates are normal while checking .mdx/.md variants.
    }
  }
  return null
}

/**
 * Get the series config from _series.md in the series directory.
 * The file uses gray-matter: frontmatter fields map to SeriesConfig,
 * and the markdown body becomes descriptionContent.
 */
function getSeriesConfigUncached(seriesSlug: string): SeriesConfig | null {
  const configPath = path.join(seriesDirectory, seriesSlug, "_series.md")
  if (!fs.existsSync(configPath)) {
    return null
  }

  const configContent = safeReadFile(configPath, describeSeries(seriesSlug, configPath))
  if (!configContent) {
    return null
  }

  const { data, content } = matter(configContent)
  const context = describeSeries(seriesSlug, configPath)
  warnUnknownKeys(data, seriesConfigFrontmatterKeys, context)

  const title = optionalString(data, "title", context)
  if (!title) {
    warnContentDiagnostic(`${context} is missing required "title" frontmatter; skipping`)
    return null
  }

  const created = normalizedDate(data, "created", context).raw
  const updated = normalizedDate(data, "updated", context).raw

  return {
    title,
    draft: optionalBoolean(data, "draft", context, false),
    excerpt: optionalString(data, "excerpt", context),
    descriptionContent: content.trim() || undefined,
    order: optionalNumber(data, "order", context),
    status: optionalString(data, "status", context),
    epistemic: optionalString(data, "epistemic", context),
    created,
    updated,
    tags: normalizeTags(data.tags, context),
  }
}

const getSeriesConfig = cache(getSeriesConfigUncached)

/**
 * Get all series slugs
 */
async function getSeriesSlugsUncached(): Promise<string[]> {
  if (!fs.existsSync(seriesDirectory)) {
    return []
  }

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(seriesDirectory, { withFileTypes: true })
  } catch (error) {
    warnContentDiagnostic(`Unable to read series directory ${contentPath(seriesDirectory)}`, error)
    return []
  }

  return entries
    .filter(entry => {
      const entryPath = path.join(seriesDirectory, entry.name)
      return safeStat(entryPath)?.isDirectory() ?? false
    })
    .map(entry => entry.name)
}

/**
 * Get all posts in a series, sorted by order
 */
async function getSeriesPostsUncached(seriesSlug: string): Promise<SeriesPost[]> {
  const seriesPath = path.join(seriesDirectory, seriesSlug)

  if (!fs.existsSync(seriesPath)) {
    return []
  }

  const stat = safeStat(seriesPath)
  if (!stat?.isDirectory()) {
    return []
  }

  const fileNames = safeReadDir(seriesPath, describeSeries(seriesSlug))

  const posts = fileNames
    .filter(fileName => {
      return (fileName.endsWith(".md") || fileName.endsWith(".mdx")) && !fileName.startsWith("_")
    })
    .map(fileName => {
      const slug = fileName.replace(/\.mdx?$/, "")
      const fullPath = path.join(seriesPath, fileName)
      return seriesPostFromFile(seriesSlug, slug, fullPath, false)
    })
    .filter((post): post is SeriesPost => post !== null)
    .filter(post => !post.frontmatter.draft)
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order)

  return posts
}

function seriesPostFromFile(
  seriesSlug: string,
  postSlug: string,
  fullPath: string,
  includeFilePath: boolean,
): SeriesPost | null {
  const context = describeSeriesPost(seriesSlug, postSlug, fullPath)
  const fileContents = safeReadFile(fullPath, context)
  if (!fileContents) {
    return null
  }

  const { data, content } = matter(fileContents)
  warnUnknownKeys(data, seriesPostFrontmatterKeys, context)

  const created = normalizedDate(data, "created", context)
  const updated = normalizedDate(data, "updated", context)

  return {
    slug: postSlug,
    content,
    filePath: includeFilePath ? contentPath(fullPath) : undefined,
    readingTime: calculateReadingTime(content),
    externalUrl: optionalString(data, "externalUrl", context),
    frontmatter: {
      title: optionalString(data, "title", context) ?? postSlug,
      order: optionalNumber(data, "order", context) ?? 999,
      created: created.formatted,
      createdRaw: created.raw,
      updated: updated.formatted,
      updatedRaw: updated.raw,
      description: optionalString(data, "description", context) ?? "",
      draft: optionalBoolean(data, "draft", context, false),
      tags: normalizeTags(data.tags, context),
      ogImage: optionalString(data, "ogImage", context),
    },
  }
}

/**
 * Get a specific post from a series
 */
async function getSeriesPostUncached(seriesSlug: string, postSlug: string): Promise<SeriesPost | null> {
  const seriesPath = path.join(seriesDirectory, seriesSlug)

  const fullPath = findFirstExistingFile([
    path.join(seriesPath, `${postSlug}.mdx`),
    path.join(seriesPath, `${postSlug}.md`),
  ])

  if (!fullPath) {
    return null
  }

  const post = seriesPostFromFile(seriesSlug, postSlug, fullPath, true)
  if (post?.frontmatter.draft) {
    return null
  }

  return post
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
  if (config.created && config.updated) {
    return {
      created: formatContentDate(config.created) ?? undefined,
      createdRaw: contentDateISOString(config.created) ?? undefined,
      updated: formatContentDate(config.updated) ?? undefined,
      updatedRaw: contentDateISOString(config.updated) ?? undefined,
    }
  }

  const allCreatedDates: Date[] = []
  const allUpdatedDates: Date[] = []

  for (const post of posts) {
    if (post.frontmatter.createdRaw) {
      allCreatedDates.push(new Date(post.frontmatter.createdRaw))
    }
    if (post.frontmatter.updatedRaw) {
      allUpdatedDates.push(new Date(post.frontmatter.updatedRaw))
    } else if (post.frontmatter.createdRaw) {
      allUpdatedDates.push(new Date(post.frontmatter.createdRaw))
    }
  }

  let createdDate: Date | undefined
  if (config.created) {
    createdDate = new Date(config.created)
  } else if (allCreatedDates.length > 0) {
    createdDate = new Date(Math.min(...allCreatedDates.map(d => d.getTime())))
  }

  let updatedDate: Date | undefined
  if (config.updated) {
    updatedDate = new Date(config.updated)
  } else if (allUpdatedDates.length > 0) {
    updatedDate = new Date(Math.max(...allUpdatedDates.map(d => d.getTime())))
  }

  return {
    created: createdDate ? formatContentDate(createdDate) ?? undefined : undefined,
    createdRaw: createdDate ? createdDate.toISOString() : undefined,
    updated: updatedDate ? formatContentDate(updatedDate) ?? undefined : undefined,
    updatedRaw: updatedDate ? updatedDate.toISOString() : undefined,
  }
}

/**
 * Get a complete series with config and posts
 */
async function getSeriesUncached(seriesSlug: string): Promise<Series | null> {
  const config = getSeriesConfig(seriesSlug)
  if (!config) {
    return null
  }

  const posts = await getSeriesPosts(seriesSlug)
  const dates = inferSeriesDates(posts, config)

  return {
    slug: seriesSlug,
    title: config.title,
    draft: config.draft,
    excerpt: config.excerpt,
    descriptionContent: config.descriptionContent,
    posts,
    status: config.status,
    epistemic: config.epistemic,
    tags: config.tags,
    ...dates,
  }
}

/**
 * Get all series with their configs and posts, excluding drafts
 */
async function getAllSeriesUncached(): Promise<Series[]> {
  const slugs = await getSeriesSlugs()
  const seriesList: Series[] = []

  for (const slug of slugs) {
    const series = await getSeries(slug)
    if (series && !series.draft) {
      seriesList.push(series)
    }
  }

  return seriesList
}

/** Public series slugs only — draft series are omitted from static params */
async function getAllSeriesSlugsUncached(): Promise<string[]> {
  const slugs = await getSeriesSlugs()
  const publicSlugs: string[] = []

  for (const slug of slugs) {
    const series = await getSeries(slug)
    if (series && !series.draft) {
      publicSlugs.push(slug)
    }
  }

  return publicSlugs
}

export const getSeriesSlugs = cache(getSeriesSlugsUncached)
export const getSeriesPosts = cache(getSeriesPostsUncached)
export const getSeriesPost = cache(getSeriesPostUncached)
export const getSeries = cache(getSeriesUncached)
export const getAllSeries = cache(getAllSeriesUncached)
export const getAllSeriesSlugs = cache(getAllSeriesSlugsUncached)
