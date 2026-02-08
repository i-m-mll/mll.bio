import { getAllPoems, poemsConfig, formatPoemDate } from "@/lib/poems"
import { MDXContent } from "@/components/mdx-content"
import { getSection } from "@/lib/sections"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verse",
  description: "A collection of verse",
}

export default async function VersePage() {
  const poems = await getAllPoems()
  const intro = await getSection("verse-intro")
  const { dates: dateConfig } = poemsConfig

  const renderPoems = () => (
    <div className="poems-grid">
      {poems.map((poem) => (
        <PoemCard
          key={poem.slug}
          slug={poem.slug}
          title={poem.frontmatter.title}
          content={poem.content}
          created={poem.frontmatter.created}
          updated={poem.frontmatter.updated}
          dateConfig={dateConfig}
        />
      ))}
    </div>
  )

  return (
    <main className="container max-w-4xl py-10">
      <header className="mb-8">
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
  slug: string
  title: string
  content: string
  created?: string
  updated?: string
  dateConfig: typeof poemsConfig.dates
}

async function PoemCard({ slug, title, content, created, updated, dateConfig }: PoemCardProps) {
  const createdDate = dateConfig.showCreated ? formatPoemDate(created, dateConfig.format) : null
  const updatedDate = dateConfig.showUpdated ? formatPoemDate(updated, dateConfig.format) : null
  // Only show updated if it's different from created
  const showUpdated = updatedDate && updatedDate !== createdDate

  return (
    <article id={slug} className="poem-card flex flex-col items-start group/poem">
      <h2 className="mb-2 text-xl font-semibold tracking-tight">
        <a
          href={`#${slug}`}
          className="hover:underline decoration-muted-foreground/50 underline-offset-2"
        >
          {title}
          <span className="ml-2 text-muted-foreground/0 group-hover/poem:text-muted-foreground/60 transition-colors text-base">
            #
          </span>
        </a>
      </h2>
      {(createdDate || showUpdated) && (
        <div className="mb-4 text-sm text-muted-foreground">
          {createdDate && <span>{createdDate}</span>}
          {showUpdated && (
            <span> – {updatedDate}</span>
          )}
        </div>
      )}
      <div className="poem-content prose prose-slate dark:prose-invert prose-p:my-0 prose-p:leading-relaxed">
        <MDXContent>{content}</MDXContent>
      </div>
    </article>
  )
}
