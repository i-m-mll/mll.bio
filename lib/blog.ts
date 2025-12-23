import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface Post {
  slug: string
  content: string
  filePath?: string // Relative path to the file (for diff tools)
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

export async function getPosts(): Promise<Post[]> {
  // Create posts directory if it doesn't exist
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true })
    return []
  }

  const fileNames = fs.readdirSync(postsDirectory)

  const posts = fileNames
    .filter((fileName) => {
      // Only include .md and .mdx files
      return fileName.endsWith(".md") || fileName.endsWith(".mdx")
    })
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx?$/, "")
      const fullPath = path.join(postsDirectory, fileName)
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

    // If .mdx doesn't exist, try .md
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(postsDirectory, `${slug}.md`)

      // If neither exists, return null
      if (!fs.existsSync(fullPath)) {
        return null
      }
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
