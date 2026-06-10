"use client"

import { useEffect, useId, useState } from "react"
import { useHeadingObserver } from "@/lib/use-heading-observer"
import { TocList } from "@/components/toc-list"
import { TocHeader } from "@/components/toc-header"

interface TocItem {
  id: string
  title: string
  level: number
}

interface MobileTocProps {
  content: string
}

function extractHeadings(markdown: string): TocItem[] {
  const headingRegex = /^(#{2,6})\s+(.+)$/gm
  const items: TocItem[] = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const title = match[2].trim()
    const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    items.push({ id, title, level })
  }
  return items
}

export function MobileToc({ content }: MobileTocProps) {
  const tocId = useId()
  const [tocItems, setTocItems] = useState<TocItem[]>(() => extractHeadings(content))
  const [isCollapsed, setIsCollapsed] = useState(false)

  const { activeId } = useHeadingObserver()

  useEffect(() => {
    setTocItems(extractHeadings(content))
  }, [content])

  if (tocItems.length === 0) {
    return null
  }

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }

  return (
    <div className="tablet:hidden mb-6 mobile-toc">
      <div className="toc-container">
        <TocHeader 
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          controlsId={`${tocId}-inline-list`}
        />
        
        {!isCollapsed && (
          <TocList
            id={`${tocId}-inline-list`}
            items={tocItems}
            activeId={activeId}
            onItemClick={handleHeadingClick}
          />
        )}
      </div>
    </div>
  )
} 
