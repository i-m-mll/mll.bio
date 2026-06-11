import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkHtml from "remark-html"
import { sanitizeHtml } from "./html-sanitizer.mjs"

export interface Project {
  slug: string
  title: string
  url: string
  icon?: string
  tags?: string[]
  descriptionHtml: string
  order: number
}

const projectsDirectory = path.join(process.cwd(), "content/projects")

async function markdownToHtml(markdown: string): Promise<string> {
  // unified's TypeScript overloads don't handle the remark-parse → remark-html pipeline well;
  // the cast to `any` avoids the false-positive type error at the .use() call site.
  const processor = (unified() as any).use(remarkParse).use(remarkHtml, { sanitize: false })
  const result = await processor.process(markdown)
  return sanitizeHtml(String(result))
}

export async function getProjects(): Promise<Project[]> {
  if (!fs.existsSync(projectsDirectory)) {
    return []
  }

  const files = fs
    .readdirSync(projectsDirectory)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))

  const projects = await Promise.all(
    files.map(async (filename) => {
      const slug = filename.replace(/\.mdx?$/, "")
      const fullPath = path.join(projectsDirectory, filename)
      const fileContents = fs.readFileSync(fullPath, "utf8")
      const { data, content } = matter(fileContents)

      const descriptionHtml = await markdownToHtml(content.trim())

      return {
        slug,
        title: (data.title as string) || slug,
        url: (data.url as string) || "",
        icon: data.icon as string | undefined,
        tags: data.tags as string[] | undefined,
        descriptionHtml,
        order: typeof data.order === "number" ? data.order : 999,
      }
    })
  )

  return projects.sort((a, b) => a.order - b.order)
}
