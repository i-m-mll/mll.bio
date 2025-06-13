import { getPosts } from "@/lib/blog"
import { PostList } from "@/components/post-list"
import { notFound } from "next/navigation"
import { siteConfig } from "@/lib/config"

export const metadata = {
  title: "Blog",
  description: "My thoughts and ideas",
}

export default async function BlogPage() {
  // Check if blog is enabled in config
  if (!siteConfig.pages.blog) {
    notFound()
  }

  const posts = await getPosts()

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Blog</h1>
      {posts.length > 0 ? <PostList posts={posts} /> : <p className="text-muted-foreground">No posts published yet.</p>}
    </div>
  )
}
