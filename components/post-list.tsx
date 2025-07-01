import Link from "next/link"
import type { Post } from "@/lib/blog"
import { renderInlineMarkdown } from "@/lib/utils"

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <article key={post.slug} className="border-b pb-8 last:border-0">
          <Link href={`/blog/${post.slug}`} className="space-y-2 block">
            <time className="text-sm text-muted-foreground">
              {post.frontmatter.published}
            </time>
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
            <p className="text-muted-foreground">{post.frontmatter.description}</p>
          </Link>
        </article>
      ))}
    </div>
  )
}
