import type { Post } from "@/lib/blog"
import type { Series } from "@/lib/series"

export type PostListItem = Post & {
  frontmatter: Post["frontmatter"] & {
    series?: string
    seriesSlug?: string
  }
}

export function seriesPostsToPostListItems(allSeries: Series[]): PostListItem[] {
  return allSeries.flatMap(series =>
    series.posts.map(post => ({
      slug: `series/${series.slug}/${post.slug}`,
      content: post.content,
      readingTime: post.readingTime,
      frontmatter: {
        title: post.frontmatter.title,
        published: post.frontmatter.created || "",
        publishedRaw: post.frontmatter.createdRaw || "",
        updated: post.frontmatter.updated,
        updatedRaw: post.frontmatter.updatedRaw,
        description: post.frontmatter.description || "",
        tags: post.frontmatter.tags,
        series: series.title,
        seriesSlug: series.slug,
      },
    }))
  )
}

export function sortPostListItemsByPublishedDate(posts: PostListItem[]): PostListItem[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.frontmatter.publishedRaw || "").getTime() || 0
    const dateB = new Date(b.frontmatter.publishedRaw || "").getTime() || 0
    return dateB - dateA
  })
}
