import { getPosts } from "@/lib/blog"
import { getAllSeries } from "@/lib/series"
import { FilterablePostList } from "@/components/filterable-post-list"
import { MDXContent } from "@/components/mdx-content"
import { getSection } from "@/lib/sections"
import { notFound } from "next/navigation"
import { siteConfig } from "@/lib/config/site"
import { SubscribeBox } from "@/components/subscribe-box"
import { renderInlineMarkdown } from "@/lib/utils"
import Link from "next/link"
import { buildPageMetadata } from "@/lib/metadata"
import { seriesPostsToPostListItems, sortPostListItemsByPublishedDate } from "@/lib/post-listing"

export const metadata = buildPageMetadata({
  title: "Posts",
  description: "Essays, notes, and series from MLL.",
  path: "/blog",
})

export default async function BlogPage() {
  // Check if blog is enabled in config
  if (!siteConfig.pages.blog) {
    notFound()
  }

  const [posts, allSeries, intro] = await Promise.all([
    getPosts(),
    getAllSeries(),
    getSection("posts-intro"),
  ])

  const seriesPosts = seriesPostsToPostListItems(allSeries)
  const sortedPosts = sortPostListItemsByPublishedDate(posts)

  return (
    <div className="container max-w-4xl py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Posts</h1>
        {intro && (
          <article className="prose dark:prose-invert mt-4">
            <MDXContent>{intro.content}</MDXContent>
          </article>
        )}
        <div className="mt-6 flex justify-center">
          <SubscribeBox />
        </div>
      </header>

      {/* Series Section */}
      {allSeries.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Series</h2>
          <div className="space-y-4">
            {allSeries.map((series) => (
              <Link
                key={series.slug}
                href={`/series/${series.slug}`}
                className="block p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <h3 className="font-semibold">{series.title}</h3>
                {series.excerpt && (
                  <p
                    className="text-sm text-muted-foreground mt-1"
                    dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(series.excerpt) }}
                  />
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {series.posts.length} {series.posts.length === 1 ? "part" : "parts"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Posts */}
      <section>
        <FilterablePostList
          posts={sortedPosts}
          seriesPosts={seriesPosts}
          showSeriesByDefault={siteConfig.blog.showSeriesPostsByDefault}
        />
      </section>
    </div>
  )
}
