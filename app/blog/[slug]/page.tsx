import { getPost, getPosts } from "@/lib/blog"
import { MDXContent } from "@/components/mdx-content"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { siteConfig } from "@/lib/config"
import { Comments } from "@/components/comments"

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
    <div className="container max-w-4xl py-10">
      <article className="prose dark:prose-invert mx-auto">
        <h1 className="mb-2">{post.frontmatter.title}</h1>
        <p className="text-muted-foreground text-sm mb-8">{format(new Date(post.frontmatter.date), "MMMM d, yyyy")}</p>
        <MDXContent>{post.content}</MDXContent>
      </article>

      {/* Add comments section */}
      <Comments title={post.frontmatter.title} />
    </div>
  )
}
