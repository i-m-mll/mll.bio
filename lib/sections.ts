import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface Section {
  slug: string
  content: string
  frontmatter: {
    title: string
    showHeading?: boolean
  }
}

const sectionsDirectory = path.join(process.cwd(), "content/sections")

/**
 * Get a specific section by slug
 */
export async function getSection(slug: string): Promise<Section | null> {
  const filePath = path.join(sectionsDirectory, `${slug}.md`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const fileContents = fs.readFileSync(filePath, "utf8")
    const { data, content } = matter(fileContents)

    return {
      slug,
      content,
      frontmatter: {
        title: data.title || slug,
        showHeading: data.showHeading ?? false,
      },
    }
  } catch {
    return null
  }
}

/**
 * Get multiple sections by slugs, in order
 */
export async function getSections(slugs: string[]): Promise<Section[]> {
  const sections: Section[] = []

  for (const slug of slugs) {
    const section = await getSection(slug)
    if (section) {
      sections.push(section)
    }
  }

  return sections
}
