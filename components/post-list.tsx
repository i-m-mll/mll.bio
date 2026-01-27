import Link from "next/link"
import type { Post } from "@/lib/blog"
import { renderInlineMarkdown } from "@/lib/utils"

// Extended post type that may include series info
interface ExtendedPost extends Post {
  frontmatter: Post["frontmatter"] & {
    series?: string
    seriesSlug?: string
  }
}

export function PostList({ posts }: { posts: ExtendedPost[] }) {
  return (
    <div className="space-y-8">
      {posts.map((post) => {
        // Series posts have slug starting with "series/", regular posts go to /blog/
        const href = post.slug.startsWith("series/") ? `/${post.slug}` : `/blog/${post.slug}`

        return (
          <article key={post.slug} className="pb-8 last:pb-0">
            <Link href={href} className="space-y-2 block">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <time>{post.frontmatter.published}</time>
                {post.readingTime && (
                  <>
                    <span>·</span>
                    <span>{post.readingTime}</span>
                  </>
                )}
                {post.frontmatter.series && (
                  <>
                    <span>·</span>
                    <span className="text-primary/70">{post.frontmatter.series}</span>
                  </>
                )}
              </div>
              <h2
                className="text-xl font-bold tracking-tight hover:underline font-heading"
                dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(post.frontmatter.title) }}
              />
              {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.frontmatter.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-stone-100 dark:bg-stone-925 text-muted-foreground px-1.5 py-0.5 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {post.frontmatter.description && (
                <p className="text-muted-foreground">{post.frontmatter.description}</p>
              )}
            </Link>
          </article>
        )
      })}
    </div>
  )
}
