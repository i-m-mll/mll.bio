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

export interface Post {
  slug: string
  content: string
  filePath?: string // Relative path to the file (for diff tools)
  readingTime: string // Computed reading time (e.g., "5 min read")
  frontmatter: {
    title: string
    published: string
    publishedRaw: string // ISO date for reliable sorting
    updated?: string
    updatedRaw?: string // ISO date for reliable sorting
    description: string
    abstract?: string
    status?: string // Completion status (e.g., "work in progress", "rough draft", "finished")
    epistemic?: string // Epistemic confidence (e.g., "speculative", "confident", "exploratory")
    showtoc?: boolean
    sidenotes?: boolean
    draft?: boolean
    tags?: string[]
    ogImage?: string // Open Graph image URL or path relative to site root
    // Keep 'date' for backward compatibility
    date?: string
  }
}

type Frontmatter = Record<string, unknown>

interface PostFile {
  slug: string
  fullPath: string
}

interface NormalizedPostFrontmatter {
  title: string
  published: string
  publishedRaw: string
  updated?: string
  updatedRaw?: string
  description: string
  abstract?: string
  status?: string
  epistemic?: string
  showtoc: boolean
  sidenotes: boolean
  draft: boolean
  tags?: string[]
  ogImage?: string
  date: string
}

const postsDirectory = path.join(process.cwd(), "content/posts")

const postFrontmatterKeys = new Set([
  "title",
  "published",
  "date",
  "updated",
  "description",
  "abstract",
  "status",
  "epistemic",
  "showtoc",
  "sidenotes",
  "draft",
  "tags",
  "ogImage",
])

function describePost(slug: string, fullPath: string): string {
  return `post "${slug}" (${contentPath(fullPath)})`
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

function normalizePostFrontmatter(
  data: Frontmatter,
  slug: string,
  fullPath: string,
): NormalizedPostFrontmatter | null {
  const context = describePost(slug, fullPath)
  warnUnknownKeys(data, postFrontmatterKeys, context)

  const publishedSource = data.published ?? data.date
  if (publishedSource === undefined || publishedSource === null) {
    warnContentDiagnostic(`${context} is missing "published" frontmatter; skipping`)
    return null
  }

  if (
    typeof publishedSource !== "string" &&
    typeof publishedSource !== "number" &&
    !(publishedSource instanceof Date)
  ) {
    warnContentDiagnostic(`${context} frontmatter key "published" must be a valid date; skipping`)
    return null
  }

  const publishedRaw = contentDateISOString(publishedSource)
  const published = formatContentDate(publishedSource)
  if (!publishedRaw || !published) {
    warnContentDiagnostic(`${context} has invalid "published" frontmatter; skipping`)
    return null
  }

  const updatedSource = data.updated
  let updated: string | undefined
  let updatedRaw: string | undefined
  if (updatedSource !== undefined && updatedSource !== null) {
    if (
      typeof updatedSource !== "string" &&
      typeof updatedSource !== "number" &&
      !(updatedSource instanceof Date)
    ) {
      warnContentDiagnostic(`${context} frontmatter key "updated" must be a valid date; ignoring it`)
    } else {
      updatedRaw = contentDateISOString(updatedSource) ?? undefined
      updated = formatContentDate(updatedSource) ?? undefined
      if (!updatedRaw || !updated) {
        warnContentDiagnostic(`${context} has invalid "updated" frontmatter; ignoring it`)
        updatedRaw = undefined
        updated = undefined
      }
    }
  }

  const title = optionalString(data, "title", context) ?? slug
  if (data.title === undefined || data.title === null) {
    warnContentDiagnostic(`${context} is missing "title" frontmatter; using slug`)
  }

  return {
    title,
    published,
    publishedRaw,
    updated,
    updatedRaw,
    description: optionalString(data, "description", context) ?? "",
    abstract: optionalString(data, "abstract", context),
    status: optionalString(data, "status", context),
    epistemic: optionalString(data, "epistemic", context),
    showtoc: optionalBoolean(data, "showtoc", context, true),
    sidenotes: optionalBoolean(data, "sidenotes", context, true),
    draft: optionalBoolean(data, "draft", context, false),
    tags: normalizeTags(data.tags, context),
    ogImage: optionalString(data, "ogImage", context),
    date: published,
  }
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

function findFirstExistingFile(candidates: string[]): string | null {
  for (const candidate of candidates) {
    try {
      const stat = fs.lstatSync(candidate)
      if (stat.isFile() || stat.isSymbolicLink()) {
        return candidate
      }
    } catch {
      // Missing candidates are normal while checking .mdx/.md and folder variants.
    }
  }
  return null
}

function findFirstExistingPath(candidates: string[]): string | null {
  for (const candidate of candidates) {
    try {
      fs.lstatSync(candidate)
      return candidate
    } catch {
      // Missing candidates are normal while checking .mdx/.md and folder variants.
    }
  }
  return null
}

function collectPostFiles(): PostFile[] {
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(postsDirectory, { withFileTypes: true })
  } catch (error) {
    warnContentDiagnostic(`Unable to read posts directory ${contentPath(postsDirectory)}`, error)
    return []
  }

  const postFiles: PostFile[] = []

  for (const entry of entries) {
    const entryPath = path.join(postsDirectory, entry.name)
    const stat = safeStat(entryPath)
    if (!stat) {
      continue
    }

    if (stat.isDirectory()) {
      const dirName = entry.name
      const fullPath = findFirstExistingPath([
        path.join(postsDirectory, dirName, `${dirName}.mdx`),
        path.join(postsDirectory, dirName, `${dirName}.md`),
      ])
      if (fullPath) {
        postFiles.push({ slug: dirName, fullPath })
      }
    } else if (stat.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))) {
      postFiles.push({
        slug: entry.name.replace(/\.mdx?$/, ""),
        fullPath: entryPath,
      })
    }
  }

  assertUniquePostSlugs(postFiles)
  return postFiles
}

function assertUniquePostSlugs(postFiles: PostFile[]): void {
  const seen = new Map<string, string>()

  for (const postFile of postFiles) {
    const existingPath = seen.get(postFile.slug)
    if (existingPath) {
      throw new Error(
        `[content] Duplicate post slug "${postFile.slug}" from ` +
          `${contentPath(existingPath)} and ${contentPath(postFile.fullPath)}`,
      )
    }
    seen.set(postFile.slug, postFile.fullPath)
  }
}

function postFromFile({ slug, fullPath }: PostFile, includeFilePath: boolean): Post | null {
  const fileContents = safeReadFile(fullPath, `post "${slug}"`)
  if (!fileContents) {
    return null
  }

  const { data, content } = matter(fileContents)
  const frontmatter = normalizePostFrontmatter(data, slug, fullPath)
  if (!frontmatter || frontmatter.draft) {
    return null
  }

  return {
    slug,
    content,
    filePath: includeFilePath ? contentPath(fullPath) : undefined,
    readingTime: calculateReadingTime(content),
    frontmatter,
  }
}

async function getPostsUncached(): Promise<Post[]> {
  return collectPostFiles()
    .map(postFile => postFromFile(postFile, false))
    .filter((post): post is Post => post !== null)
    .sort((a, b) => {
      return new Date(b.frontmatter.publishedRaw).getTime() - new Date(a.frontmatter.publishedRaw).getTime()
    })
}

/** All post slugs including drafts — for generateStaticParams only */
async function getAllPostSlugsUncached(): Promise<string[]> {
  return collectPostFiles().map(postFile => postFile.slug)
}

async function getPostUncached(slug: string): Promise<Post | null> {
  const fullPath = findFirstExistingFile([
    path.join(postsDirectory, `${slug}.mdx`),
    path.join(postsDirectory, `${slug}.md`),
    path.join(postsDirectory, slug, `${slug}.mdx`),
    path.join(postsDirectory, slug, `${slug}.md`),
  ])

  if (!fullPath) {
    return null
  }

  return postFromFile({ slug, fullPath }, true)
}

export const getPosts = cache(getPostsUncached)
export const getAllPostSlugs = cache(getAllPostSlugsUncached)
export const getPost = cache(getPostUncached)
