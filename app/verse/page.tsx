import { getAllPoems, poemsConfig, formatPoemDate } from "@/lib/poems"
import { MDXContent } from "@/components/mdx-content"
import { siteConfig } from "@/lib/config/site"
import { getSection } from "@/lib/sections"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: `Verse | ${siteConfig.name}`,
  description: "A collection of verse",
}

export default async function VersePage() {
  const poems = await getAllPoems()
  const intro = await getSection("verse-intro")
  const isSideBySide = poemsConfig.layout === "side-by-side"
  const { dates: dateConfig } = poemsConfig

  // Group poems by layout type for side-by-side rendering
  const renderPoems = () => {
    if (!isSideBySide) {
      // Single column layout - render all poems in a single column
      return (
        <div className="space-y-16">
          {poems.map((poem) => (
            <PoemCard
              key={poem.slug}
              title={poem.frontmatter.title}
              content={poem.content}
              created={poem.frontmatter.created}
              updated={poem.frontmatter.updated}
              dateConfig={dateConfig}
            />
          ))}
        </div>
      )
    }

    // Side-by-side layout using CSS columns for automatic height balancing
    //
    // Layout strategy:
    // - Consecutive half-width poems go into a CSS columns container
    // - CSS columns automatically balance content across columns (masonry-like)
    // - Full-width poems break out of the columns container
    // - On mobile: single column, poems stack vertically
    // - Horizontal scroll handled by .poem-content for overflowing poem text
    const elements: React.ReactNode[] = []
    let i = 0

    while (i < poems.length) {
      // Collect consecutive half-width poems
      const halfPoems: typeof poems = []
      while (i < poems.length && poems[i].frontmatter.layout === "half") {
        halfPoems.push(poems[i])
        i++
      }

      // Render collected half-width poems in a columns container
      if (halfPoems.length > 0) {
        elements.push(
          <div key={`columns-${i}`} className="poems-columns">
            {halfPoems.map((poem) => (
              <PoemCard
                key={poem.slug}
                title={poem.frontmatter.title}
                content={poem.content}
                created={poem.frontmatter.created}
                updated={poem.frontmatter.updated}
                dateConfig={dateConfig}
              />
            ))}
          </div>
        )
      }

      // Render any full-width poem
      if (i < poems.length && poems[i].frontmatter.layout !== "half") {
        const poem = poems[i]
        elements.push(
          <PoemCard
            key={poem.slug}
            title={poem.frontmatter.title}
            content={poem.content}
            created={poem.frontmatter.created}
            updated={poem.frontmatter.updated}
            dateConfig={dateConfig}
          />
        )
        i++
      }
    }

    return <div className="space-y-16">{elements}</div>
  }

  return (
    <main className="container max-w-4xl py-10">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight">Verse</h1>
        {intro && (
          <article className="prose dark:prose-invert mt-4">
            <MDXContent>{intro.content}</MDXContent>
          </article>
        )}
      </header>

      {poems.length === 0 ? (
        <p className="text-muted-foreground">No verse yet.</p>
      ) : (
        renderPoems()
      )}
    </main>
  )
}

interface PoemCardProps {
  title: string
  content: string
  created?: string
  updated?: string
  dateConfig: typeof poemsConfig.dates
}

async function PoemCard({ title, content, created, updated, dateConfig }: PoemCardProps) {
  const createdDate = dateConfig.showCreated ? formatPoemDate(created, dateConfig.format) : null
  const updatedDate = dateConfig.showUpdated ? formatPoemDate(updated, dateConfig.format) : null
  // Only show updated if it's different from created
  const showUpdated = updatedDate && updatedDate !== createdDate

  return (
    <article className="poem-card flex flex-col items-start">
      <h2 className="mb-2 text-xl font-semibold tracking-tight">{title}</h2>
      {(createdDate || showUpdated) && (
        <div className="mb-4 text-sm text-muted-foreground">
          {createdDate && <span>{createdDate}</span>}
          {showUpdated && (
            <span className="ml-2 text-xs">(updated {updatedDate})</span>
          )}
        </div>
      )}
      <div className="poem-content prose prose-slate dark:prose-invert prose-p:my-0 prose-p:leading-relaxed">
        <MDXContent>{content}</MDXContent>
      </div>
    </article>
  )
}
