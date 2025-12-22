import { MDXContent } from "@/components/mdx-content"
import { PostList } from "@/components/post-list"
import { getPosts } from "@/lib/blog"
import { SocialLinks } from "@/components/social-links"
import { SubscribeForm } from "@/components/subscribe-form"
import { siteConfig } from "@/lib/config/site"
import { getSection } from "@/lib/sections"
import { projects } from "@/lib/config/projects"
import { ProjectList } from "@/components/project-card"
import Link from "next/link"

// Section components for dynamic rendering
async function IntroSection() {
  const section = await getSection("intro")
  if (!section) return null

  return (
    <article className="prose dark:prose-invert">
      <MDXContent>{section.content}</MDXContent>
    </article>
  )
}

function SocialLinksSection() {
  return <SocialLinks />
}

async function WhatIDoSection() {
  const section = await getSection("what-i-do")
  if (!section) return null

  return (
    <article className="prose dark:prose-invert">
      {section.frontmatter.showHeading && (
        <h2 className="text-3xl font-bold tracking-tight mb-4 font-heading">{section.frontmatter.title}</h2>
      )}
      <MDXContent>{section.content}</MDXContent>
    </article>
  )
}

function ProjectsSection() {
  if (projects.length === 0) return null

  return (
    <section>
      <h3 className="text-2xl font-semibold tracking-tight mb-4 font-heading">Projects</h3>
      <ProjectList projects={projects} />
    </section>
  )
}

async function BackgroundSection() {
  const section = await getSection("background")
  if (!section) return null

  return (
    <article className="prose dark:prose-invert">
      {section.frontmatter.showHeading && (
        <h2 className="text-3xl font-bold tracking-tight mb-4 font-heading">{section.frontmatter.title}</h2>
      )}
      <MDXContent>{section.content}</MDXContent>
    </article>
  )
}

async function GoAheadSection() {
  const section = await getSection("go-ahead")
  if (!section) return null

  return (
    <article className="prose dark:prose-invert">
      {section.frontmatter.showHeading && (
        <h2 className="text-3xl font-bold tracking-tight mb-4 font-heading">{section.frontmatter.title}</h2>
      )}
      <MDXContent>{section.content}</MDXContent>
    </article>
  )
}

function SubscribeSection() {
  if (!siteConfig.newsletter.buttondownUsername) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Subscribe via <Link href="/feed.xml" className="underline hover:text-foreground">RSS</Link>.
        </p>
      </div>
    )
  }

  const showBorder = siteConfig.homepage.subscribeBorder

  return (
    <div className={`mx-auto p-5 rounded-md bg-stone-50/50 dark:bg-stone-900/50 max-w-md text-center ${showBorder ? 'border border-stone-200 dark:border-stone-700' : ''}`}>
      <h3 className="text-xl font-semibold mb-3 font-heading">Subscribe</h3>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Get new posts by email:</p>
          <SubscribeForm buttondownUsername={siteConfig.newsletter.buttondownUsername} />
        </div>
        <p className="text-sm text-muted-foreground">
          Or via <Link href="/feed.xml" className="underline hover:text-foreground">RSS</Link>.
        </p>
      </div>
    </div>
  )
}

async function RecentPostsSection() {
  const posts = await getPosts()
  const recentPosts = posts.slice(0, 3)

  if (recentPosts.length === 0) return null

  return (
    <div className="md:grid md:grid-cols-[auto_1fr] md:gap-x-12 md:items-start">
      <h2 className="text-3xl font-bold tracking-tight mb-8 md:mb-0 font-heading">
        Recent Posts
      </h2>
      <PostList posts={recentPosts} />
    </div>
  )
}

// Map section names to components
const sectionComponents: Record<string, () => Promise<React.ReactNode> | React.ReactNode> = {
  "intro": IntroSection,
  "social-links": SocialLinksSection,
  "what-i-do": WhatIDoSection,
  "projects": ProjectsSection,
  "background": BackgroundSection,
  "go-ahead": GoAheadSection,
  "subscribe": SubscribeSection,
  "recent-posts": RecentPostsSection,
}

export default async function HomePage() {
  const sections = siteConfig.homepage.sections

  return (
    <div className="container max-w-4xl py-10 space-y-12">
      {sections.map(async (sectionName, index) => {
        const SectionComponent = sectionComponents[sectionName]
        if (!SectionComponent) return null

        const content = await SectionComponent()
        if (!content) return null

        return (
          <div key={`${sectionName}-${index}`}>
            {content}
          </div>
        )
      })}
    </div>
  )
}
