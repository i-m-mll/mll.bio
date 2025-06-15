import { getPost, getPosts } from "@/lib/blog"
import { MDXContent } from "@/components/mdx-content"
import { TableOfContents } from "@/components/table-of-contents"
import { SidenoteSelection } from "@/components/sidenote-selection"
import { Footnotes } from "@/components/footnotes"
import { MobileToc } from "@/components/mobile-toc"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { siteConfig } from "@/lib/config"
import { uiConfig } from "@/lib/ui-config"

export async function generateStaticParams() {
  // Only generate pages for published posts if blog is enabled
  if (!siteConfig.pages.blog) {
    return []
  }

  const posts = await getPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  if (!post) {
    return {}
  }

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  // Check if blog is enabled in config
  if (!siteConfig.pages.blog) {
    notFound()
  }

  const post = await getPost(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="grid grid-cols-1 tablet:grid-cols-[250px_1fr] desktop:grid-cols-[250px_1fr_20vw] gap-8 max-w-full px-2 tablet:px-4">
      <SidenoteSelection />
      <TableOfContents content={post.content} postTitle={post.frontmatter.title} />
      <div className="container pt-6 pb-6 tablet:py-10 desktop:py-10 tablet:col-start-2 desktop:col-start-2">
        <article className="prose dark:prose-invert mx-auto">
          <p className="text-muted-foreground text-sm mb-2">{format(new Date(post.frontmatter.date), "MMMM d, yyyy")}</p>
          <h1 className="mb-8">{post.frontmatter.title}</h1>
          {uiConfig.mobileToc.enableInlineToc && <MobileToc content={post.content} />}
          <MDXContent>{post.content}</MDXContent>
          <Footnotes content={post.content} />
        </article>
      </div>
    </div>
  )
}
