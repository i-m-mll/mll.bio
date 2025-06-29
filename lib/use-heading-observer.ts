"use client"

import { useEffect, useState } from "react"

/**
 * Provides the id of the heading currently nearest the top of the viewport and
 * whether the main <h1> title is out of view (scrolled past).
 *
 * Internally uses a single IntersectionObserver so we avoid work on every
 * scroll tick.  Works for pages that render their Markdown/MDX headings into
 * the document during initial mount (static export).
 *
 * selector – CSS selector for headings to observe.  Default targets h2-h4 that
 * appear inside the article element.
 * offset   – percentage (0-1) of viewport from top that should count as the
 *            activation line; 0.2 = trigger when heading crosses 20% from top.
 */
export function useHeadingObserver(
  selector: string = "article :is(h2,h3,h4)",
  offset: number = 0.2,
) {
  const [activeId, setActiveId] = useState<string>("")
  const [mainTitleOut, setMainTitleOut] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(selector),
    )
    const mainTitle = document.querySelector<HTMLElement>("h1")

    if (headings.length === 0 && !mainTitle) return

    // Trigger when heading top crosses offset (e.g. 20%) from top.
    const rootMarginTop = `-${offset * 100}%` // negative pushes threshold down
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement
          if (target === mainTitle) {
            // For title we only care about visibility
            setMainTitleOut(!entry.isIntersecting)
            return
          }

          // Any heading that becomes visible nearer the top becomes the active
          if (entry.isIntersecting) {
            setActiveId(target.id)
          }
        })
      },
      {
        // make bottom margin large so we get callbacks early, but only when the
        // element crosses the top threshold.
        rootMargin: `${rootMarginTop} 0px -80% 0px`,
        threshold: 0,
      },
    )

    headings.forEach((h) => h.id && io.observe(h))
    if (mainTitle) io.observe(mainTitle)

    return () => io.disconnect()
  }, [selector, offset])

  return {
    activeId,
    mainTitleOut,
  }
}
