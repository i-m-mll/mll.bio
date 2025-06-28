import { getPage } from "@/lib/content"
import { MDXContent } from "@/components/mdx-content"
import { PostList } from "@/components/post-list"
import { getPosts } from "@/lib/blog"
import { SocialLinks } from "@/components/social-links"

export default async function HomePage() {
  const { content } = await getPage("home")
  const posts = await getPosts()
  const recentPosts = posts.slice(0, 3)

  return (
    <div className="container max-w-4xl py-10">
      <article className="prose dark:prose-invert mx-auto mb-12">
        <MDXContent>{content}</MDXContent>
      </article>

      <div className="mb-12">
        <SocialLinks />
      </div>

      <div className="mb-8 md:grid md:grid-cols-[auto_1fr] md:gap-x-12 md:items-start">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8 md:mb-0 font-heading">
          Recent Posts
        </h2>
        <PostList posts={recentPosts} />
      </div>
    </div>
  )
}
