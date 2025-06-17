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
              className="text-2xl font-bold tracking-tight hover:underline"
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(post.frontmatter.title) }}
            />
            <p className="text-muted-foreground">{post.frontmatter.description}</p>
          </Link>
        </article>
      ))}
    </div>
  )
}
