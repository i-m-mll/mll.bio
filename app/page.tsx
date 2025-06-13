import { getPage } from "@/lib/content"
import { MDXContent } from "@/components/mdx-content"
import { PostList } from "@/components/post-list"
import { getPosts } from "@/lib/blog"
import { SocialLinks } from "@/components/social-links"

export default async function HomePage() {
  const { content, frontmatter } = await getPage("home")
  const posts = await getPosts()
  const recentPosts = posts.slice(0, 3)

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{frontmatter.title}</h1>
        <p className="text-muted-foreground text-lg">{frontmatter.description}</p>
      </div>

      <div className="mb-8">
        <SocialLinks />
      </div>

      <article className="prose dark:prose-invert mx-auto mb-12">
        <MDXContent>{content}</MDXContent>
      </article>

      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Recent Posts</h2>
        <PostList posts={recentPosts} />
      </div>
    </div>
  )
}
