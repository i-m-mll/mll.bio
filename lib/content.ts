import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface PageContent {
  content: string
  frontmatter: {
    title: string
    description: string
    draft?: boolean
    [key: string]: any
  }
}

const pagesDirectory = path.join(process.cwd(), "content/pages")

export async function getPage(slug: string): Promise<PageContent> {
  // Create pages directory if it doesn't exist
  if (!fs.existsSync(pagesDirectory)) {
    fs.mkdirSync(pagesDirectory, { recursive: true })
  }

  let fullPath = path.join(pagesDirectory, `${slug}.mdx`)

  // If .mdx doesn't exist, try .md
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(pagesDirectory, `${slug}.md`)

    // If neither exists, create a default file
    if (!fs.existsSync(fullPath)) {
      const defaultContent = `---
title: "${slug.charAt(0).toUpperCase() + slug.slice(1)}"
description: "This is the ${slug} page"
---

# ${slug.charAt(0).toUpperCase() + slug.slice(1)}

This is the ${slug} page. Edit this content in \`content/pages/${slug}.md\`.
`

      fs.writeFileSync(fullPath, defaultContent, "utf8")
    }
  }

  const fileContents = fs.readFileSync(fullPath, "utf8")
  const { data, content } = matter(fileContents)

  return {
    content,
    frontmatter: {
      title: data.title || slug.charAt(0).toUpperCase() + slug.slice(1),
      description: data.description || "",
      ...data,
    },
  }
}
