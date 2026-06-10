import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { cache } from "react"

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

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function formatDiagnosticError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export function contentPath(filePath: string): string {
  return path.relative(process.cwd(), filePath) || filePath
}

export function warnContentDiagnostic(message: string, error?: unknown): void {
  const suffix = error === undefined ? "" : `: ${formatDiagnosticError(error)}`
  console.warn(`[content] ${message}${suffix}`)
}

export function parseContentDate(dateInput: string | number | Date): Date | null {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

export function formatContentDate(dateInput: string | number | Date): string | null {
  const date = parseContentDate(dateInput)
  if (!date) {
    return null
  }

  const day = date.getUTCDate()
  const month = months[date.getUTCMonth()]
  const year = date.getUTCFullYear()

  return `${day} ${month} ${year}`
}

export function contentDateISOString(dateInput: string | number | Date): string | null {
  return parseContentDate(dateInput)?.toISOString() ?? null
}

async function getPageUncached(slug: string): Promise<PageContent | null> {
  let fullPath = path.join(pagesDirectory, `${slug}.mdx`)

  // If .mdx doesn't exist, try .md
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(pagesDirectory, `${slug}.md`)

    if (!fs.existsSync(fullPath)) {
      return null
    }
  }

  try {
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
  } catch (error) {
    warnContentDiagnostic(`Unable to read page ${slug} at ${contentPath(fullPath)}`, error)
    return null
  }
}

export const getPage = cache(getPageUncached)
