import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface Post {
  slug: string
  content: string
  frontmatter: {
    title: string
    date: string
    description: string
    draft?: boolean
  }
}

const postsDirectory = path.join(process.cwd(), "content/posts")

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

      return {
        slug,
        content,
        frontmatter: {
          title: data.title || slug,
          date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
          description: data.description || "",
          draft: data.draft || false,
        },
      }
    })
    // Filter out draft posts
    .filter((post) => !post.frontmatter.draft)
    // Sort posts by date
    .sort((a, b) => {
      return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
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

    return {
      slug,
      content,
      frontmatter: {
        title: data.title || slug,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        description: data.description || "",
      },
    }
  } catch (error) {
    console.error(`Error getting post ${slug}:`, error)
    return null
  }
}
