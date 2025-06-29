"use client"

import { useHeadingObserver } from "@/lib/use-heading-observer"
import { renderInlineMarkdown } from "@/lib/utils"

interface StickyTitleProps {
  title: string
}

export function StickyTitle({ title }: StickyTitleProps) {
  const { mainTitleOut } = useHeadingObserver()
  const showStickyTitle = mainTitleOut

  // Only render the container when there's content to show
  if (!showStickyTitle) {
    return null
  }

  return (
    <div className="hidden tablet:block toc-sidebar">
      <div className="sticky-title">
        <h2 
          className="text-lg font-semibold text-foreground mb-4 line-clamp-2 font-heading"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(title) }}
        />
      </div>
    </div>
  )
} 