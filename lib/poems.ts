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
  }
}

const poemsDirectory = path.join(process.cwd(), "content/poems")

/**
 * Process poem content to handle line breaks properly:
 * - Single newlines within stanzas become <br/> tags (visible line breaks)
 * - Double newlines (blank lines) become paragraph breaks (stanza separation)
 */
function processPoetryLineBreaks(content: string): string {
  // Split by blank lines (stanza separators)
  const stanzas = content.split(/\n\s*\n/)

  // Within each stanza, replace single newlines with <br/>
  const processed = stanzas.map(stanza =>
    stanza.trim().replace(/\n/g, '<br/>\n')
  )

  // Join stanzas with double newlines (creates <p> breaks in markdown)
  return processed.join('\n\n')
}

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
      content: processPoetryLineBreaks(content),
      frontmatter: {
        title: data.title || slug.replace(/-/g, " "),
        created: data.created,
        updated: data.updated,
      },
    })
  }

  // Sort by created date (newest first), then by title
  poems.sort((a, b) => {
    const dateA = a.frontmatter.created ? new Date(a.frontmatter.created).getTime() : 0
    const dateB = b.frontmatter.created ? new Date(b.frontmatter.created).getTime() : 0
    if (dateA !== dateB) return dateB - dateA
    return a.frontmatter.title.localeCompare(b.frontmatter.title)
  })

  return poems
}

// Poems layout configuration
export interface PoemsConfig {
  // Date display options
  dates: {
    showCreated: boolean
    showUpdated: boolean
    format: "full" | "short" | "iso"
  }
}

export const poemsConfig: PoemsConfig = {
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
