import { Suspense } from "react"
import { getSeries, getSeriesPost, getSeriesSlugs, getSeriesPosts } from "@/lib/series"
import { MDXContent } from "@/components/mdx-content"
import { TableOfContents } from "@/components/table-of-contents"
import { StickyTitle } from "@/components/sticky-title"
import { SidenoteSelection } from "@/components/sidenote-selection"
import { Footnotes } from "@/components/footnotes"
import { MobileToc } from "@/components/mobile-toc"
import { notFound } from "next/navigation"
import Link from "next/link"
import { uiConfig } from "@/lib/config/ui"
import SearchHighlighter from "@/components/search-highlighter"

interface PageParams {
  slug: string
  post: string
}

export async function generateStaticParams() {
  const seriesSlugs = await getSeriesSlugs()
  const params: PageParams[] = []

  for (const slug of seriesSlugs) {
    const posts = await getSeriesPosts(slug)
    for (const post of posts) {
      params.push({ slug, post: post.slug })
    }
  }

  return params
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { slug, post: postSlug } = await params
  const post = await getSeriesPost(slug, postSlug)
  const series = await getSeries(slug)

  if (!post || !series) {
    return {}
  }

  return {
    title: `${post.frontmatter.title} | ${series.title}`,
    description: post.frontmatter.description,
  }
}

export default async function SeriesPostPage({ params }: { params: Promise<PageParams> }) {
  const { slug, post: postSlug } = await params
  const post = await getSeriesPost(slug, postSlug)
  const series = await getSeries(slug)

  if (!post || !series) {
    notFound()
  }

  // Find current post index and adjacent posts
  const currentIndex = series.posts.findIndex(p => p.slug === postSlug)
  const prevPost = currentIndex > 0 ? series.posts[currentIndex - 1] : null
  const nextPost = currentIndex < series.posts.length - 1 ? series.posts[currentIndex + 1] : null

  return (
    <div className="grid grid-cols-1 tablet:grid-cols-[250px_1fr] desktop:grid-cols-[250px_1fr_18vw] gap-8 max-w-full px-2 tablet:px-4">
      <SidenoteSelection />
      <TableOfContents content={post.content} postTitle={post.frontmatter.title} />

      <div className="container min-w-0 pt-6 pb-6 tablet:py-10 desktop:py-10 tablet:col-start-2 desktop:col-start-2">
        {/* Series breadcrumb */}
        <nav className="mb-4 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-muted-foreground">
            <li>
              <Link href={`/series/${slug}`} className="hover:text-foreground transition-colors">
                {series.title}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground font-medium">
              Part {currentIndex + 1}
            </li>
          </ol>
        </nav>

        <article className="prose dark:prose-invert mx-auto relative mb-8">
          <div className="text-muted-foreground text-sm mb-6">
            {post.frontmatter.created && (
              <div>Published: {post.frontmatter.created}</div>
            )}
            {post.frontmatter.updated && (
              <div>Updated: {post.frontmatter.updated}</div>
            )}
          </div>
          <h1 className="mb-2 font-heading">{post.frontmatter.title}</h1>
        </article>

        {uiConfig.mobileToc.enableInlineToc && (
          <MobileToc content={post.content} />
        )}

        <article className="prose dark:prose-invert mx-auto relative">
          <MDXContent>{post.content}</MDXContent>
          <Suspense fallback={null}>
            <SearchHighlighter />
          </Suspense>
          <Footnotes content={post.content} />
        </article>

        {/* Series navigation */}
        <nav className="mt-12 pt-8 border-t border-border/40" aria-label="Series navigation">
          <div className="flex justify-between items-center gap-4">
            {prevPost ? (
              <Link
                href={`/series/${slug}/${prevPost.slug}`}
                className="group flex-1 max-w-[45%]"
              >
                <span className="text-sm text-muted-foreground">← Previous</span>
                <span className="block font-medium group-hover:text-primary transition-colors truncate">
                  {prevPost.frontmatter.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            <Link
              href={`/series/${slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              <span className="block text-xs">Part of</span>
              <span className="font-medium">{series.title}</span>
            </Link>

            {nextPost ? (
              <Link
                href={`/series/${slug}/${nextPost.slug}`}
                className="group flex-1 max-w-[45%] text-right"
              >
                <span className="text-sm text-muted-foreground">Next →</span>
                <span className="block font-medium group-hover:text-primary transition-colors truncate">
                  {nextPost.frontmatter.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </nav>
      </div>
    </div>
  )
}
