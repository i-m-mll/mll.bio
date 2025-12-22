"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { useScrollDirectionContext } from "@/lib/contexts/scroll-direction"
import { uiConfig } from "@/lib/config/ui"
import type { Series, SeriesPost } from "@/lib/series"

interface SeriesHeaderProps {
  series: Series
  prevPost: SeriesPost | null
  nextPost: SeriesPost | null
  currentIndex: number
}

export function SeriesHeader({ series, prevPost, nextPost, currentIndex }: SeriesHeaderProps) {
  const { scrollDirection } = useScrollDirectionContext()
  const stickyMode = uiConfig.series.header?.stickyMode ?? 'follow-main'
  const animationMode = uiConfig.series.header?.animationMode ?? 'fade'

  // Determine if header should be visible
  const isVisible = stickyMode === 'always-visible' || scrollDirection !== 'down'

  return (
    <div className={cn(
      // Grid positioning: column 2 (content column, to the right of TOC)
      "tablet:col-start-2 desktop:col-start-2",
      // Use container for horizontal padding alignment
      "container py-0",
      // Sticky positioning below main header - moves with page during elastic scroll
      "sticky top-16 z-30",
      // Only show on tablet+
      "hidden tablet:block",
      // Background
      "bg-background",
      // Don't stretch vertically
      "self-start",
      // Position relative for border pseudo-element
      "relative",
      // Animation - use visibility to prevent "scrolling into view" when hidden
      "transition-[opacity,visibility] duration-150 ease-in-out",
      isVisible
        ? "opacity-100 visible"
        : "opacity-0 invisible pointer-events-none"
    )}>
      {/* Border line - extends from TOC right edge to page right edge */}
      <div
        className="absolute bottom-0 h-px bg-border pointer-events-none"
        style={{
          // Extend left into the gap to align with TOC's right border
          left: 'calc(-1 * var(--layout-gap, 2rem))',
          // Extend right to page edge (past sidenotes column + gap + page padding)
          right: 'calc(-1 * (18vw + var(--layout-gap, 2rem) + 1rem))',
        }}
      />

      {/* Nav content aligned with prose width (48rem matches the prose class in tailwind config) */}
      <nav
        className="flex items-center justify-between py-1.5 text-sm max-w-[48rem] mx-auto"
        aria-label="Series navigation"
      >
        {/* Previous link */}
        <div className="flex-1 min-w-0">
          {prevPost ? (
            <Link
              href={`/series/${series.slug}/${prevPost.slug}`}
              className="group inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors no-underline"
            >
              <span aria-hidden="true">←</span>
              <span className="hidden sm:inline truncate max-w-[150px]">
                {prevPost.frontmatter.title}
              </span>
              <span className="sm:hidden">Prev</span>
            </Link>
          ) : (
            <span className="text-muted-foreground/40">←</span>
          )}
        </div>

        {/* Center: Series info */}
        <div className="flex-shrink-0 text-center px-4">
          <Link
            href={`/series/${series.slug}`}
            className="hover:text-foreground transition-colors no-underline"
          >
            <span className="text-muted-foreground">Part {currentIndex + 1} of </span>
            <span className="font-medium text-foreground">{series.title}</span>
          </Link>
        </div>

        {/* Next link */}
        <div className="flex-1 min-w-0 text-right">
          {nextPost ? (
            <Link
              href={`/series/${series.slug}/${nextPost.slug}`}
              className="group inline-flex items-center justify-end gap-1 text-muted-foreground hover:text-foreground transition-colors no-underline"
            >
              <span className="hidden sm:inline truncate max-w-[150px]">
                {nextPost.frontmatter.title}
              </span>
              <span className="sm:hidden">Next</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span className="text-muted-foreground/40">→</span>
          )}
        </div>
      </nav>
    </div>
  )
}
