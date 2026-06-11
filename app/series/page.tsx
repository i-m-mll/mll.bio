import { getAllSeries } from "@/lib/series"
import { siteConfig } from "@/lib/config/site"
import { Metadata } from "next"
import { renderInlineMarkdown } from "@/lib/utils"
import Link from "next/link"
import { buildPageMetadata } from "@/lib/metadata"

export const metadata: Metadata = buildPageMetadata({
  title: "Series",
  description: "Multi-part series and essays.",
  path: "/series",
})

export default async function SeriesIndexPage() {
  const allSeries = await getAllSeries()

  return (
    <main className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-heading">Series</h1>

      {allSeries.length === 0 ? (
        <p className="text-muted-foreground">No series yet.</p>
      ) : (
        <div className="space-y-8">
          {allSeries.map((series) => (
            <article key={series.slug} className="group">
              <Link href={`/series/${series.slug}`} className="block">
                <h2 className="text-2xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                  {series.title}
                </h2>
                {series.excerpt && (
                  <p
                    className="mt-2 text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(series.excerpt) }}
                  />
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {series.posts.length} {series.posts.length === 1 ? "part" : "parts"}
                </p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
