import { Suspense } from "react"
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
import SearchHighlighter from "@/components/search-highlighter"
import { getDiffData } from "@/lib/diff-utils"
import { DiffToolbar } from "@/components/diff-toolbar"

// Check if diff mode is enabled
const enableDiff = process.env.ENABLE_DIFF === 'true' || process.env.ENABLE_EDIT === 'true'

// Force dynamic rendering when diff mode is enabled (searchParams requires it)
export const dynamic = enableDiff ? 'force-dynamic' : 'auto'

interface SearchParams {
  diff?: string
}

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
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

export default async function BlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<SearchParams>
}) {
  // Check if blog is enabled in config
  if (!siteConfig.pages.blog) {
    notFound()
  }

  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  // Get diff data if diff mode is enabled
  let diffData = null
  if (enableDiff && post.filePath) {
    const resolvedSearchParams = await searchParams
    const diffSha = resolvedSearchParams.diff
    diffData = getDiffData(post.filePath, diffSha || undefined)
  }

  return (
    <div className="grid grid-cols-1 tablet:grid-cols-[250px_1fr] desktop:grid-cols-[250px_1fr_18vw] gap-8 max-w-full px-2 tablet:px-4">
      <SidenoteSelection />
      {post.frontmatter.showtoc ? (
        <TableOfContents content={post.content} postTitle={post.frontmatter.title} />
      ) : (
        <StickyTitle title={post.frontmatter.title} />
      )}
      <div className="container min-w-0 pt-6 pb-6 tablet:py-10 desktop:py-10 tablet:col-start-2 desktop:col-start-2">
        <article className="prose dark:prose-invert mx-auto relative mb-8">
          <div className="text-muted-foreground text-sm mb-6 space-y-0.5">
            <div>Published: {post.frontmatter.published}</div>
            {post.frontmatter.updated && (
              <div>Updated: {post.frontmatter.updated}</div>
            )}
            {post.frontmatter.status && (
              <div>
                Status:{" "}
                <em
                  dangerouslySetInnerHTML={{
                    __html: renderInlineMarkdown(post.frontmatter.status)
                  }}
                />
              </div>
            )}
            {post.frontmatter.epistemic && (
              <div>
                Epistemic status:{" "}
                <em
                  dangerouslySetInnerHTML={{
                    __html: renderInlineMarkdown(post.frontmatter.epistemic)
                  }}
                />
              </div>
            )}
            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1">
                {post.frontmatter.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-stone-100 dark:bg-stone-925 text-muted-foreground px-2 py-1 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <h1
            className="mb-2 font-heading"
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
