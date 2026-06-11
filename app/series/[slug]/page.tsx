import { getSeries, getAllSeriesSlugs } from "@/lib/series"
import { notFound } from "next/navigation"
import Link from "next/link"
import { renderInlineMarkdown } from "@/lib/utils"
import { MDXContent } from "@/components/mdx-content"
import { buildPageMetadata } from "@/lib/metadata"

export async function generateStaticParams() {
  const slugs = await getAllSeriesSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const series = await getSeries(slug)

  if (!series || series.draft) {
    return {}
  }

  return buildPageMetadata({
    title: series.title,
    description: series.excerpt ?? "",
    path: `/series/${slug}`,
  })
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const series = await getSeries(slug)

  if (!series || series.draft) {
    notFound()
  }

  return (
    <div className="container max-w-4xl py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-4 font-heading">{series.title}</h1>
        {series.descriptionContent && (
          <article className="prose dark:prose-invert mb-4">
            <MDXContent>{series.descriptionContent}</MDXContent>
          </article>
        )}

        {/* Metadata section */}
        <div className="text-muted-foreground text-sm space-y-0.5">
          {series.created && (
            <div>Started: {series.created}</div>
          )}
          {series.updated && series.updated !== series.created && (
            <div>Updated: {series.updated}</div>
          )}
          {series.status && (
            <div>
              Status:{" "}
              <em
                dangerouslySetInnerHTML={{
                  __html: renderInlineMarkdown(series.status)
                }}
              />
            </div>
          )}
          {series.epistemic && (
            <div>
              Epistemic status:{" "}
              <em
                dangerouslySetInnerHTML={{
                  __html: renderInlineMarkdown(series.epistemic)
                }}
              />
            </div>
          )}
          {series.tags && series.tags.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-1">
              {series.tags.map((tag, index) => (
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
      </header>

      <nav aria-label="Series posts">
        <ol className="space-y-4">
          {series.posts.map((post, index) => {
            const cardClassName = "group block p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            const cardInner = (
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">
                    {post.frontmatter.title}
                    <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                  </h2>
                  {post.frontmatter.description && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {post.frontmatter.description}
                    </p>
                  )}
                </div>
              </div>
            )
            return (
              <li key={post.slug}>
                {post.externalUrl ? (
                  <a
                    href={post.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClassName}
                  >
                    {cardInner}
                  </a>
                ) : (
                  <Link
                    href={`/series/${slug}/${post.slug}`}
                    className={cardClassName}
                  >
                    {cardInner}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {series.posts.length === 0 && (
        <p className="text-muted-foreground text-center py-10">
          No posts in this series yet.
        </p>
      )}
    </div>
  )
}
