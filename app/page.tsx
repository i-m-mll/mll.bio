import { getPage } from "@/lib/content"
import { MDXContent } from "@/components/mdx-content"
import { PostList } from "@/components/post-list"
import { getPosts } from "@/lib/blog"
import { SocialLinks } from "@/components/social-links"
import { SubscribeForm } from "@/components/subscribe-form"
import { siteConfig } from "@/lib/config/site"
import Link from "next/link"

export default async function HomePage() {
  const { content } = await getPage("home")
  const posts = await getPosts()
  const recentPosts = posts.slice(0, 3)

  return (
    <div className="container max-w-4xl py-10">
      <article className="prose dark:prose-invert mb-12">
        <MDXContent>{content}</MDXContent>
      </article>

      <div className="mb-12">
        <SocialLinks />
      </div>

      {/* Subscribe section */}
      <div className="mx-auto mb-12 p-5 rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/50 max-w-md text-center">
        <h3 className="text-base font-semibold mb-3">Subscribe</h3>
        <div className="space-y-3">
          {siteConfig.newsletter.buttondownUsername && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Get new posts by email:</p>
              <SubscribeForm buttondownUsername={siteConfig.newsletter.buttondownUsername} />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Or via <Link href="/feed.xml" className="underline hover:text-foreground">RSS</Link>.
          </p>
        </div>
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
