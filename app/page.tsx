import { MDXContent } from "@/components/mdx-content"
import { PostList } from "@/components/post-list"
import { getPosts } from "@/lib/blog"
import { SocialLinks } from "@/components/social-links"
import { SubscribeBox } from "@/components/subscribe-box"
import { siteConfig } from "@/lib/config/site"
import { getSection } from "@/lib/sections"
import { getProjects } from "@/lib/projects"
import { ProjectList } from "@/components/project-card"

// Unified size for all homepage section headings — change here to restyle all at once
const sectionHeadingClass = "text-3xl font-bold tracking-tight font-heading"

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
        <h2 className={`${sectionHeadingClass} mb-4`}>{section.frontmatter.title}</h2>
      )}
      <MDXContent>{section.content}</MDXContent>
    </article>
  )
}

async function ProjectsSection() {
  const projects = await getProjects()
  if (projects.length === 0) return null

  return (
    <section>
      <h2 className={`${sectionHeadingClass} mb-4`}>Projects</h2>
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
        <h2 className={`${sectionHeadingClass} mb-4`}>{section.frontmatter.title}</h2>
      )}
      <MDXContent>{section.content}</MDXContent>
    </article>
  )
}

async function GoAheadSection() {
  const section = await getSection("go-ahead")
  if (!section) return null

  const includeSubscribe = section.frontmatter.includeSubscribe

  // Two-column layout when includeSubscribe is true: 1/3 text + 2/3 subscribe
  if (includeSubscribe) {
    return (
      <div className="grid grid-cols-1 tablet:grid-cols-3 gap-8 tablet:gap-10 items-center">
        {/* Left 1/3: Go ahead content */}
        <article className="prose dark:prose-invert tablet:col-span-1">
          {section.frontmatter.showHeading && (
            <h2 className={`${sectionHeadingClass} mb-4`}>{section.frontmatter.title}</h2>
          )}
          <MDXContent>{section.content}</MDXContent>
        </article>

        {/* Right 2/3: Subscribe centered */}
        <div className="tablet:col-span-2 flex items-center justify-center">
          <SubscribeBox />
        </div>
      </div>
    )
  }

  // Single-column layout (default)
  return (
    <article className="prose dark:prose-invert">
      {section.frontmatter.showHeading && (
        <h2 className={`${sectionHeadingClass} mb-4`}>{section.frontmatter.title}</h2>
      )}
      <MDXContent>{section.content}</MDXContent>
    </article>
  )
}

function SubscribeSection() {
  return <SubscribeBox className="mx-auto max-w-md" />
}

async function RecentPostsSection() {
  const posts = await getPosts()
  const recentPosts = posts.slice(0, 3)

  if (recentPosts.length === 0) return null

  return (
    <div className="md:grid md:grid-cols-[auto_1fr] md:gap-x-12 md:items-start">
      <h2 className={`${sectionHeadingClass} mb-8 md:mb-0`}>
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
