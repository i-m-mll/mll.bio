import { Suspense } from "react"
import { getSeries, getSeriesPost, getAllSeriesSlugs, getSeriesPosts } from "@/lib/series"
import { MDXContent } from "@/components/mdx-content"
import { TableOfContents } from "@/components/table-of-contents"
import { StickyTitle } from "@/components/sticky-title"
import { SidenoteSelection } from "@/components/sidenote-selection"
import { Footnotes } from "@/components/footnotes"
import { MobileToc } from "@/components/mobile-toc"
import { notFound } from "next/navigation"
import { uiConfig } from "@/lib/config/ui"
import SearchHighlighter from "@/components/search-highlighter"
import { SeriesHeaderSetter } from "@/components/series-header-setter"
import { getDiffData } from "@/lib/diff-utils"
import { DiffToolbar } from "@/components/diff-toolbar"
import { absoluteUrl, buildPageMetadata, jsonLdScript } from "@/lib/metadata"
import { siteConfig } from "@/lib/config/site"

// Check if diff mode is enabled (used at runtime only, not for static config)
const enableDiff = process.env.ENABLE_DIFF === 'true' || process.env.ENABLE_EDIT === 'true'

// Only generate pages for explicitly listed params; anything else is 404
export const dynamicParams = false

interface PageParams {
  slug: string
  post: string
}

interface SearchParams {
  diff?: string
}

export async function generateStaticParams() {
  const seriesSlugs = await getAllSeriesSlugs()
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

  const title = `${post.frontmatter.title} | ${series.title}`
  const description = post.frontmatter.description
  const ogImage = post.frontmatter.ogImage

  return buildPageMetadata({
    title,
    description,
    path: `/series/${slug}/${postSlug}`,
    ogImage,
    type: "article",
  })
}

export default async function SeriesPostPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>
  searchParams: Promise<SearchParams>
}) {
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

  // Get diff data if diff mode is enabled
  // Only access searchParams when diff mode is enabled to preserve static generation otherwise
  let diffData = null
  if (enableDiff && post.filePath) {
    const resolvedSearchParams = await searchParams
    const diffSha = resolvedSearchParams.diff
    diffData = getDiffData(post.filePath, diffSha || undefined)
  }

  return (
    <div className="grid grid-cols-1 tablet:grid-cols-[250px_1fr] desktop:grid-cols-[250px_1fr_18vw] gap-8 max-w-full px-2 tablet:px-4">
      <SidenoteSelection />
      {/^#{2,6}\s+/m.test(post.content) ? (
        <TableOfContents content={post.content} postTitle={post.frontmatter.title} />
      ) : (
        <StickyTitle title={post.frontmatter.title} />
      )}

      {/* Set series header data for rendering in site header */}
      <SeriesHeaderSetter
        data={{
          series,
          prevPost,
          nextPost,
          currentIndex,
        }}
      />

      {/* Content container - extra top padding on tablet+ for spacing below series header */}
      <div className="container min-w-0 pt-2 pb-6 tablet:pt-20 tablet:pb-10 desktop:pt-20 desktop:pb-10 tablet:col-start-2 desktop:col-start-2">
        <article className="prose dark:prose-invert mx-auto relative mb-8">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={jsonLdScript({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.frontmatter.title,
              description: post.frontmatter.description || series.excerpt || siteConfig.description,
              url: absoluteUrl(`/series/${slug}/${postSlug}`),
              isPartOf: {
                "@type": "CreativeWorkSeries",
                name: series.title,
                url: absoluteUrl(`/series/${slug}`),
              },
              datePublished: post.frontmatter.createdRaw,
              dateModified: post.frontmatter.updatedRaw || post.frontmatter.createdRaw,
              author: {
                "@type": "Person",
                name: siteConfig.author,
                url: siteConfig.url,
              },
              image: absoluteUrl(post.frontmatter.ogImage || "/egg1.png"),
            })}
          />
          <h1 className="mb-2 font-heading">{post.frontmatter.title}</h1>
          <div className="text-muted-foreground text-sm mb-6 space-y-0.5">
            <div>{post.readingTime}</div>
            {post.frontmatter.created && (
              <div>Published: {post.frontmatter.created}</div>
            )}
            {post.frontmatter.updated && (
              <div>Updated: {post.frontmatter.updated}</div>
            )}
          </div>
        </article>

        {uiConfig.mobileToc.enableInlineToc && (
          <MobileToc content={post.content} />
        )}

        <article className="prose dark:prose-invert mx-auto relative">
          <MDXContent comparisonContent={diffData?.oldContent ?? undefined}>{post.content}</MDXContent>
          <Suspense fallback={null}>
            <SearchHighlighter />
          </Suspense>
          <Footnotes content={post.content} />
        </article>
      </div>

      {/* Diff toolbar - only shown when diff mode is enabled */}
      {enableDiff && diffData && post.filePath && (
        <DiffToolbar
          commits={diffData.commits}
          currentSha={diffData.comparisonSha}
          hasUncommittedChanges={diffData.hasUncommittedChanges}
          filePath={post.filePath}
          diffLines={diffData.diffLines}
        />
      )}
    </div>
  )
}
