import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { siteConfig } from "@/lib/config/site"

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
    draft?: boolean
    tags?: string[]
    // Keep 'date' for backward compatibility
    date?: string
  }
}

const postsDirectory = path.join(process.cwd(), "content/posts")

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

// Helper function to parse tags from frontmatter
function parseTags(tagsInput: string | string[] | undefined): string[] | undefined {
  if (!tagsInput) return undefined

  if (Array.isArray(tagsInput)) {
    return tagsInput.map(tag => tag.trim()).filter(tag => tag.length > 0)
  }

  if (typeof tagsInput === 'string') {
    return tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
  }

  return undefined
}

// Helper function to calculate reading time (excludes code blocks)
function calculateReadingTime(content: string): string {
  const { wordsPerMinute } = siteConfig.readingTime
  // Remove fenced code blocks before counting words
  const proseOnly = content.replace(/```[\s\S]*?```/g, '')
  const words = proseOnly.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}

export async function getPosts(): Promise<Post[]> {
  // Create posts directory if it doesn't exist
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true })
    return []
  }

  const entries = fs.readdirSync(postsDirectory, { withFileTypes: true })

  // Collect [slug, fullPath] pairs for flat files and folder-based posts
  const postFiles: Array<{ slug: string; fullPath: string }> = []
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Folder-based post: content/posts/<dir>/<dir>.mdx or <dir>.md
      const dirName = entry.name
      const mdxPath = path.join(postsDirectory, dirName, `${dirName}.mdx`)
      const mdPath = path.join(postsDirectory, dirName, `${dirName}.md`)
      if (fs.existsSync(mdxPath)) {
        postFiles.push({ slug: dirName, fullPath: mdxPath })
      } else if (fs.existsSync(mdPath)) {
        postFiles.push({ slug: dirName, fullPath: mdPath })
      }
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      postFiles.push({
        slug: entry.name.replace(/\.mdx?$/, ""),
        fullPath: path.join(postsDirectory, entry.name),
      })
    }
  }

  const posts = postFiles
    .map(({ slug, fullPath }) => {
      const fileContents = fs.readFileSync(fullPath, "utf8")

      const { data, content } = matter(fileContents)

      // Use 'published' if available, otherwise fall back to 'date'
      const publishedDate = data.published || data.date || new Date().toISOString()
      const publishedRaw = new Date(publishedDate).toISOString()
      const updatedDate = data.updated
      const updatedRaw = updatedDate ? new Date(updatedDate).toISOString() : undefined
      const tags = parseTags(data.tags)

      return {
        slug,
        content,
        readingTime: calculateReadingTime(content),
        frontmatter: {
          title: data.title || slug,
          published: formatDate(publishedDate),
          publishedRaw,
          updated: updatedDate ? formatDate(updatedDate) : undefined,
          updatedRaw,
          description: data.description || "",
          abstract: data.abstract || undefined,
          status: data.status || undefined,
          epistemic: data.epistemic || undefined,
          showtoc: data.showtoc !== false,
          draft: data.draft || false,
          tags,
          // Keep 'date' for backward compatibility
          date: formatDate(publishedDate),
        },
      }
    })
    // Filter out draft posts
    .filter((post) => !post.frontmatter.draft)
    // Sort posts by published date (most recent first) using raw ISO dates
    .sort((a, b) => {
      return new Date(b.frontmatter.publishedRaw).getTime() - new Date(a.frontmatter.publishedRaw).getTime()
    })

  return posts
}

export async function getPost(slug: string): Promise<Post | null> {
  try {
    let fullPath = path.join(postsDirectory, `${slug}.mdx`)

    // If .mdx doesn't exist, try .md, then folder-based variants
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(postsDirectory, `${slug}.md`)
    }
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(postsDirectory, slug, `${slug}.mdx`)
    }
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(postsDirectory, slug, `${slug}.md`)
    }
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, "utf8")
    const { data, content } = matter(fileContents)

    // Don't return draft posts
    if (data.draft) {
      return null
    }

    // Use 'published' if available, otherwise fall back to 'date'
    const publishedDate = data.published || data.date || new Date().toISOString()
    const publishedRaw = new Date(publishedDate).toISOString()
    const updatedDate = data.updated
    const updatedRaw = updatedDate ? new Date(updatedDate).toISOString() : undefined
    const tags = parseTags(data.tags)

    // Get relative file path from project root for diff tools
    const relativeFilePath = path.relative(process.cwd(), fullPath)

    return {
      slug,
      content,
      filePath: relativeFilePath,
      readingTime: calculateReadingTime(content),
      frontmatter: {
        title: data.title || slug,
        published: formatDate(publishedDate),
        publishedRaw,
        updated: updatedDate ? formatDate(updatedDate) : undefined,
        updatedRaw,
        description: data.description || "",
        abstract: data.abstract || undefined,
        status: data.status || undefined,
        epistemic: data.epistemic || undefined,
        showtoc: data.showtoc !== false,
        draft: data.draft || false,
        tags,
        // Keep 'date' for backward compatibility
        date: formatDate(publishedDate),
      },
    }
  } catch (error) {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error getting post ${slug}:`, error)
    }
    return null
  }
}
