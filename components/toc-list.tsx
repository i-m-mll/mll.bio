"use client"

import { renderInlineMarkdown } from "@/lib/utils"

interface TocItem {
  id: string
  title: string
  level: number
}

interface TocListProps {
  items: TocItem[]
  activeId: string
  onItemClick: (id: string) => void
}

export function TocList({ items, activeId, onItemClick }: TocListProps) {
  return (
    <nav className="text-xs">
      <ul className="space-y-1 list-none p-0">
        {items.map((item) => {
          const renderedTitle = renderInlineMarkdown(item.title)
          
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={() => onItemClick(item.id)}
                className={`block w-full text-left py-1 border-none bg-transparent cursor-pointer no-underline transition-colors duration-200 leading-snug toc-link level-${item.level} ${
                  activeId === item.id 
                    ? 'text-primary font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                dangerouslySetInnerHTML={{ __html: renderedTitle }}
              />
            </li>
          )
        })}
      </ul>
    </nav>
  )
} 