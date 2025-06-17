"use client"

import { useEffect, useState } from "react"
import { renderInlineMarkdown } from "@/lib/utils"

interface StickyTitleProps {
  title: string
}

export function StickyTitle({ title }: StickyTitleProps) {
  const [showStickyTitle, setShowStickyTitle] = useState(false)

  useEffect(() => {
    // Handle scroll to show/hide sticky title
    const handleScroll = () => {
      const mainTitle = document.querySelector('h1')
      if (mainTitle) {
        const rect = mainTitle.getBoundingClientRect()
        setShowStickyTitle(rect.bottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Only render the container when there's content to show
  if (!showStickyTitle) {
    return null
  }

  return (
    <div className="hidden tablet:block toc-sidebar">
      <div className="sticky-title">
        <h2 
          className="text-lg font-semibold text-foreground mb-4 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(title) }}
        />
      </div>
    </div>
  )
} 