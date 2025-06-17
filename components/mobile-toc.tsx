"use client"

import { useEffect, useState } from "react"
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

export function MobileToc({ content }: MobileTocProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    // Extract headings from the content
    const headingRegex = /^(#{2,6})\s+(.+)$/gm
    const items: TocItem[] = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const title = match[2].trim()
      const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      
      items.push({ id, title, level })
    }

    setTocItems(items)
  }, [content])

  useEffect(() => {
    // Handle scroll to highlight active section
    const handleScroll = () => {
      // Find the currently active heading
      const headings = tocItems.map(item => document.getElementById(item.id)).filter(Boolean)
      let currentActiveId = ""

      for (const heading of headings) {
        if (heading) {
          const rect = heading.getBoundingClientRect()
          if (rect.top <= 100) { // 100px offset from top
            currentActiveId = heading.id
          }
        }
      }

      setActiveId(currentActiveId)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [tocItems])

  if (tocItems.length === 0) {
    return null
  }

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="tablet:hidden mb-6 mobile-toc">
      <div className="toc-container">
        <TocHeader 
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
        
        {!isCollapsed && (
          <TocList
            items={tocItems}
            activeId={activeId}
            onItemClick={handleHeadingClick}
          />
        )}
      </div>
    </div>
  )
} 