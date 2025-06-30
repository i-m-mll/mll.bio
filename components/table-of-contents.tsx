"use client"

import { useEffect, useState } from "react"
import { useHeadingObserver } from "@/lib/use-heading-observer"
import { uiConfig } from "@/lib/config/ui"
import { renderInlineMarkdown } from "@/lib/utils"

interface TocItem {
  id: string
  title: string
  renderedTitle: string
  level: number
}

interface TableOfContentsProps {
  content: string
  postTitle: string
}

// Utility to extract headings (h2-h6) from raw markdown content
function extractHeadings(markdown: string) {
  const headingRegex = /^(#{2,6})\s+(.+)$/gm
  const items: TocItem[] = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const title = match[2].trim()
    const renderedTitle = renderInlineMarkdown(title)
    const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    items.push({ id, title, renderedTitle, level })
  }

  return items
}

export function TableOfContents({ content, postTitle }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>(() => extractHeadings(content))
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showMobileToc, setShowMobileToc] = useState(false)

  // Global observer provides current heading + h1 visibility
  const { activeId, mainTitleOut } = useHeadingObserver()
  const showStickyTitle = mainTitleOut

  // Keep client-side behavior intact by updating when content changes.
  useEffect(() => {
    setTocItems(extractHeadings(content))
  }, [content])

  if (tocItems.length === 0) {
    return null
  }

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setShowMobileToc(false)
    }
  }

  // Get button position classes based on config
  const getButtonPositionClasses = () => {
    switch (uiConfig.mobileToc.buttonPosition) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
      default:
        return 'bottom-4 right-4'
    }
  }

  return (
    <>
      {/* Mobile TOC - only visible on mobile and if enabled in config */}
      {uiConfig.mobileToc.enableFloatingButton && (
        <>
          <button
            onClick={() => setShowMobileToc(!showMobileToc)}
            className={`js-only fixed ${getButtonPositionClasses()} z-50 bg-background border border-border rounded-md p-2 shadow-lg tablet:hidden`}
          >
            <span className="text-sm font-medium">Contents</span>
          </button>
          
          {showMobileToc && (
            <div className="js-only fixed inset-0 z-40 bg-background/80 backdrop-blur-sm tablet:hidden">
              <div className="fixed left-0 top-0 h-full w-80 bg-background border-r border-border p-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold">Contents</h3>
                  <button
                    onClick={() => setShowMobileToc(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
                
                <nav className="toc-nav">
                  <ul className="space-y-1">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={() => handleHeadingClick(item.id)}
                          className={`toc-link level-${item.level} ${
                            activeId === item.id ? 'active' : ''
                          }`}
                          dangerouslySetInnerHTML={{ __html: item.renderedTitle }}
                        />
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </>
      )}

      {/* Desktop/Tablet TOC - hidden on mobile */}
      <div className="hidden tablet:block toc-sidebar">
        {showStickyTitle && (
          <div className="sticky-title">
            <h2 
              className="text-lg font-semibold text-foreground mb-4 line-clamp-2 font-heading"
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(postTitle) }}
            />
          </div>
        )}
        
        <div className="toc-container">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-3 w-full py-2 border-none bg-transparent cursor-pointer text-sm text-foreground border-b border-border mb-1 hover:text-primary"
          >
            <span className={`toc-toggle-icon transform transition-transform text-xs ${isCollapsed ? '' : 'rotate-90'}`}>
              ▸
            </span>
            <span className="font-semibold text-foreground font-heading">Contents</span>
          </button>
          
          {!isCollapsed && (
            <nav className="toc-nav">
              <ul className="space-y-1">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={() => handleHeadingClick(item.id)}
                      className={`toc-link level-${item.level} ${
                        activeId === item.id ? 'active' : ''
                      }`}
                      dangerouslySetInnerHTML={{ __html: item.renderedTitle }}
                    />
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </>
  )
} 