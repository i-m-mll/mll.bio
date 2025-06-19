import { getPost, getPosts } from "@/lib/blog"
import { MDXContent } from "@/components/mdx-content"
import { TableOfContents } from "@/components/table-of-contents"
import { StickyTitle } from "@/components/sticky-title"
import { SidenoteSelection } from "@/components/sidenote-selection"
import { Footnotes } from "@/components/footnotes"
import { MobileToc } from "@/components/mobile-toc"
import { notFound } from "next/navigation"
import { siteConfig } from "@/lib/config/site"
import { uiConfig } from "@/lib/config/ui"
import { renderInlineMarkdown, stripMarkdown } from "@/lib/utils"

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
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {}
  }

  return {
    title: stripMarkdown(post.frontmatter.title),
    description: post.frontmatter.description,
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  // Check if blog is enabled in config
  if (!siteConfig.pages.blog) {
    notFound()
  }

  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="grid grid-cols-1 tablet:grid-cols-[250px_1fr] desktop:grid-cols-[250px_1fr_18vw] gap-8 max-w-full px-2 tablet:px-4">
      <SidenoteSelection />
      {post.frontmatter.showtoc ? (
        <TableOfContents content={post.content} postTitle={post.frontmatter.title} />
      ) : (
        <StickyTitle title={post.frontmatter.title} />
      )}
      <div className="container pt-6 pb-6 tablet:py-10 desktop:py-10 tablet:col-start-2 desktop:col-start-2">
        <article className="prose dark:prose-invert mx-auto relative mb-8">
          <div className="text-muted-foreground text-sm mb-6">
            <div>Published: {post.frontmatter.published}</div>
            {post.frontmatter.updated && (
              <div>Updated: {post.frontmatter.updated}</div>
            )}
          </div>
          <h1 
            className="mb-2"
            dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(post.frontmatter.title) }}
          />
          {post.frontmatter.abstract && (
            <div
              className="p-4 rounded-md bg-stone-75 dark:bg-stone-925 mb-6"
              dangerouslySetInnerHTML={{
                __html: renderInlineMarkdown(post.frontmatter.abstract)
              }}
            />
          )}
        </article>
        
        {post.frontmatter.showtoc && uiConfig.mobileToc.enableInlineToc && (
          <MobileToc content={post.content} />
        )}
        
        <article className="prose dark:prose-invert mx-auto relative">
          <MDXContent>{post.content}</MDXContent>
          <Footnotes content={post.content} />
        </article>
      </div>
    </div>
  )
}
