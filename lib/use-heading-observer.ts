"use client"

import { useEffect, useState } from "react"

/**
 * Provides the id of the heading currently nearest the top of the viewport and
 * whether the main <h1> title is out of view (scrolled past).
 *
 * Uses an IntersectionObserver for section headings.  The main title uses a
 * throttled geometry check so sticky headers count as the top occlusion edge.
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

    // Observer for post headings – triggers slightly earlier so activeId updates
    const rootMarginTop = `-${offset * 100}%`
    const headingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId((entry.target as HTMLElement).id)
          }
        })
      },
      {
        rootMargin: `${rootMarginTop} 0px -80% 0px`,
        threshold: 0,
      },
    )

    headings.forEach((h) => h.id && headingObserver.observe(h))

    const headerComplexBottom = () => {
      let bottom = 0
      const header = document.querySelector<HTMLElement>("header")

      if (header) {
        const rect = header.getBoundingClientRect()
        const style = window.getComputedStyle(header)
        if (style.display !== "none" && style.visibility !== "hidden" && rect.bottom > 0) {
          bottom = Math.max(bottom, rect.bottom)
        }
      }

      const seriesHeader = document.querySelector<HTMLElement>(
        '[data-series-header-visible="true"] nav[aria-label="Series navigation"]',
      )

      if (seriesHeader) {
        const rect = seriesHeader.getBoundingClientRect()
        const style = window.getComputedStyle(seriesHeader)
        if (style.display !== "none" && style.visibility !== "hidden" && rect.bottom > 0) {
          bottom = Math.max(bottom, rect.bottom)
        }
      }

      return bottom
    }

    let titleFrame: number | null = null

    const updateTitleVisibility = () => {
      titleFrame = null

      if (!mainTitle) return

      const titleBottom = mainTitle.getBoundingClientRect().bottom
      const isOut = titleBottom <= headerComplexBottom() + 0.5
      setMainTitleOut((current) => current === isOut ? current : isOut)
    }

    const queueTitleVisibilityUpdate = () => {
      if (titleFrame !== null) return
      titleFrame = window.requestAnimationFrame(updateTitleVisibility)
    }

    if (mainTitle) {
      queueTitleVisibilityUpdate()
      window.addEventListener("scroll", queueTitleVisibilityUpdate, { passive: true })
      window.addEventListener("resize", queueTitleVisibilityUpdate)
    }

    return () => {
      headingObserver.disconnect()
      if (titleFrame !== null) {
        window.cancelAnimationFrame(titleFrame)
      }
      if (mainTitle) {
        window.removeEventListener("scroll", queueTitleVisibilityUpdate)
        window.removeEventListener("resize", queueTitleVisibilityUpdate)
      }
    }
  }, [selector, offset])

  return {
    activeId,
    mainTitleOut,
  }
}
