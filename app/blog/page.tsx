import { getPosts } from "@/lib/blog"
import { getAllSeries } from "@/lib/series"
import { PostList } from "@/components/post-list"
import { MDXContent } from "@/components/mdx-content"
import { getSection } from "@/lib/sections"
import { notFound } from "next/navigation"
import { siteConfig } from "@/lib/config/site"
import Link from "next/link"

export const metadata = {
  title: "Posts",
  description: "My thoughts and ideas",
}

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

  // Convert series posts to the same format as regular posts for the combined list
  const seriesPosts = allSeries.flatMap(series =>
    series.posts.map(post => ({
      slug: `series/${series.slug}/${post.slug}`,
      content: post.content,
      frontmatter: {
        title: post.frontmatter.title,
        published: post.frontmatter.created || "",
        publishedRaw: post.frontmatter.created || "",
        updated: post.frontmatter.updated,
        updatedRaw: post.frontmatter.updated,
        description: post.frontmatter.description || "",
        series: series.title,
        seriesSlug: series.slug,
      },
    }))
  )

  // Combine and sort all posts by date
  const allPosts = [...posts, ...seriesPosts].sort((a, b) => {
    const dateA = new Date(a.frontmatter.publishedRaw || "").getTime() || 0
    const dateB = new Date(b.frontmatter.publishedRaw || "").getTime() || 0
    return dateB - dateA
  })

  return (
    <div className="container max-w-4xl py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Posts</h1>
        {intro && (
          <article className="prose dark:prose-invert mt-4">
            <MDXContent>{intro.content}</MDXContent>
          </article>
        )}
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
                {series.description && (
                  <p className="text-sm text-muted-foreground mt-1">{series.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {series.posts.length} {series.posts.length === 1 ? "part" : "parts"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Posts (including series posts) */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">All Posts</h2>
        {allPosts.length > 0 ? (
          <PostList posts={allPosts} />
        ) : (
          <p className="text-muted-foreground">No posts published yet.</p>
        )}
      </section>
    </div>
  )
}
