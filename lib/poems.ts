import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface Poem {
  slug: string
  content: string
  frontmatter: {
    title: string
    created?: string
    updated?: string
    // Layout: "full" for single column, "half" for side-by-side pairing
    layout?: "full" | "half"
    // Order for sorting poems
    order?: number
  }
}

const poemsDirectory = path.join(process.cwd(), "content/poems")

export async function getAllPoems(): Promise<Poem[]> {
  if (!fs.existsSync(poemsDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(poemsDirectory)
  const poems: Poem[] = []

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".md") && !fileName.endsWith(".mdx")) {
      continue
    }

    const slug = fileName.replace(/\.mdx?$/, "")
    const fullPath = path.join(poemsDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, "utf8")
    const { data, content } = matter(fileContents)

    // Skip drafts
    if (data.draft) {
      continue
    }

    poems.push({
      slug,
      content,
      frontmatter: {
        title: data.title || slug.replace(/-/g, " "),
        created: data.created,
        updated: data.updated,
        layout: data.layout || "full",
        order: data.order ?? 999,
      },
    })
  }

  // Sort by order, then by title
  poems.sort((a, b) => {
    if (a.frontmatter.order !== b.frontmatter.order) {
      return (a.frontmatter.order ?? 999) - (b.frontmatter.order ?? 999)
    }
    return a.frontmatter.title.localeCompare(b.frontmatter.title)
  })

  return poems
}

// Poems layout configuration
export interface PoemsConfig {
  // "side-by-side" pairs adjacent half-width poems horizontally on desktop
  // "single-column" displays all poems in a single column
  layout: "side-by-side" | "single-column"
  // Date display options
  dates: {
    // Show created date
    showCreated: boolean
    // Show updated date
    showUpdated: boolean
    // Format: "full" for "December 18, 2025", "short" for "Dec 18, 2025", "iso" for "2025-12-18"
    format: "full" | "short" | "iso"
  }
}

// Default configuration - can be overridden via environment or config file
export const poemsConfig: PoemsConfig = {
  layout: "side-by-side",
  dates: {
    showCreated: true,
    showUpdated: true,
    format: "short",
  },
}

// Helper to format dates based on config
export function formatPoemDate(dateStr: string | undefined, format: PoemsConfig["dates"]["format"]): string | null {
  if (!dateStr) return null

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null

  switch (format) {
    case "full":
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    case "short":
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    case "iso":
      return date.toISOString().split("T")[0]
    default:
      return dateStr
  }
}
