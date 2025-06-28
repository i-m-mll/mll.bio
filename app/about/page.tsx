import { getPage } from "@/lib/content"
import { MDXContent } from "@/components/mdx-content"
import { notFound } from "next/navigation"
import { siteConfig } from "@/lib/config/site"

export const metadata = {
  title: "About",
  description: "About me and my work",
}

export default async function AboutPage() {
  // Check if about page is enabled in config
  if (!siteConfig.pages.about) {
    notFound()
  }

  const { content, frontmatter } = await getPage("about")

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6 font-heading">{frontmatter.title}</h1>
      <article className="prose dark:prose-invert mx-auto">
        <MDXContent>{content}</MDXContent>
      </article>
    </div>
  )
}
