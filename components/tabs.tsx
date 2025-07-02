"use client"
import { useState, ReactNode, ReactElement, Children, useId, KeyboardEvent } from "react"

interface TabProps {
  /**
   * Visible label that appears in the tab header.
   */
  label: string
  /**
   * Content shown when the tab is active. Can be any valid React node – markdown, JSX, etc.
   */
  children: ReactNode
  /**
   * Optional className that will be applied to the tab panel wrapper.
   */
  className?: string
}

/**
 * Tab acts as a logical wrapper only – it never renders by itself.
 * It is consumed by the parent <Tabs> component.
 */
export function Tab(_props: TabProps) {
  // The actual rendering responsibility is taken by <Tabs>.
  return null
}

interface TabsProps {
  /**
   * <Tab> elements as children.
   */
  children: ReactNode
  /**
   * Index of the tab that is active on mount.
   */
  defaultIndex?: number
  /**
   * Additional classes for the outer wrapper.
   */
  className?: string
  /**
   * ARIA label for assistive tech. If omitted, tab labels will be read individually.
   */
  ariaLabel?: string
}

export function Tabs({ children, defaultIndex = 0, className = "", ariaLabel }: TabsProps) {
  const tabIdBase = useId()
  const tabElements = Children.toArray(children).filter(Boolean) as ReactElement<TabProps>[]

  // Guard: render nothing if no valid tab children provided
  if (tabElements.length === 0) return null

  const [activeIndex, setActiveIndex] = useState(() => {
    // Clamp defaultIndex
    if (defaultIndex < 0) return 0
    if (defaultIndex >= tabElements.length) return tabElements.length - 1
    return defaultIndex
  })

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const { key } = e
    let newIndex = activeIndex

    switch (key) {
      case "ArrowRight":
      case "ArrowDown":
        newIndex = (activeIndex + 1) % tabElements.length
        break
      case "ArrowLeft":
      case "ArrowUp":
        newIndex = (activeIndex - 1 + tabElements.length) % tabElements.length
        break
      case "Home":
        newIndex = 0
        break
      case "End":
        newIndex = tabElements.length - 1
        break
      default:
        return // Ignore unhandled keys
    }

    e.preventDefault()
    setActiveIndex(newIndex)
  }

  return (
    <div className={`tabs ${className}`.trim()}>
      {/* Tab headers */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-x-2 gap-y-2 border-b border-border"
      >
        {tabElements.map((tab, idx) => {
          const isActive = idx === activeIndex
          const tabId = `${tabIdBase}-tab-${idx}`
          const panelId = `${tabIdBase}-panel-${idx}`

          return (
            <button
              key={tabId}
              id={tabId}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveIndex(idx)}
              onKeyDown={handleKeyDown}
              className={`whitespace-nowrap rounded-t border-b-2 px-3 py-2 text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-accent"
              }`}
            >
              {tab.props.label}
            </button>
          )
        })}
      </div>

      {/* Tab panels */}
      <div className="border border-border border-t-0 rounded-b-md p-4">
        {tabElements.map((tab, idx) => {
          const isActive = idx === activeIndex
          const panelId = `${tabIdBase}-panel-${idx}`
          const tabId = `${tabIdBase}-tab-${idx}`

          return (
            <div
              key={panelId}
              id={panelId}
              role="tabpanel"
              aria-labelledby={tabId}
              hidden={!isActive}
              className={`${tab.props.className ?? ""} [&>*:first-child]:mt-0 [&>*:last-child]:mb-0`}
            >
              {tab.props.children}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Allow import { Tabs, Tab } from "components/tabs"
export default { Tabs, Tab } 