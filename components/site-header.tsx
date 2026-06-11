"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { siteConfig } from "@/lib/config/site"
import { uiConfig } from "@/lib/config/ui"
import { cn } from "@/lib/utils"
import { useScrollDirectionContext } from "@/lib/contexts/scroll-direction"
import { useSeriesHeader } from "@/lib/contexts/series-header"
import dynamic from "next/dynamic"

const SearchBar = uiConfig.search.enabled
  ? dynamic(() => import("@/components/search-bar"), { ssr: false })
  : null as unknown as React.ComponentType

// Parse full name to find which characters map to initials
// e.g., "MLL" with initials "MLL" returns indices [0, 8, 12]
function getInitialIndices(fullName: string, initials: string): number[] {
  const words = fullName.split(" ")
  const indices: number[] = []
  let charIndex = 0

  for (let wordIdx = 0; wordIdx < words.length && indices.length < initials.length; wordIdx++) {
    const word = words[wordIdx]
    if (word.length > 0 && word[0].toUpperCase() === initials[indices.length].toUpperCase()) {
      indices.push(charIndex)
    }
    charIndex += word.length + 1 // +1 for space
  }

  return indices
}

// Hook to detect if viewport is narrow enough to need collapsed name
function useIsNarrowViewport(threshold: number) {
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    // Check initial width
    const checkWidth = () => setIsNarrow(window.innerWidth < threshold)
    checkWidth()

    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [threshold])

  return isNarrow
}

// Animated name component that transitions between full name and short name
// The initials (MLL) stay visible and animate to their collapsed positions
// while other letters fade out
function AnimatedName({ isHome }: { isHome: boolean }) {
  const { animateName, animationDuration, collapseNameWidth } = siteConfig.header
  const duration = animationDuration / 1000
  const isNarrow = useIsNarrowViewport(collapseNameWidth)
  const shouldReduceMotion = useReducedMotion()

  const fullName = siteConfig.fullName || siteConfig.name
  const shortName = siteConfig.name

  // Show full name only on homepage AND when viewport is wide enough
  const showFullName = isHome && !isNarrow

  // If animation is disabled or there's nothing to animate (fullName === shortName), just show the name
  if (!animateName || fullName === shortName || shouldReduceMotion) {
    return (
      <span
        className="font-semibold leading-none text-title"
        style={{ fontFamily: 'var(--dev-title-font, var(--font-fira-sans))' }}
      >
        {showFullName ? fullName : shortName}
      </span>
    )
  }

  // Find which character indices in fullName correspond to the initials
  const initialIndices = getInitialIndices(fullName, shortName)
  const chars = fullName.split("")

  return (
    <motion.span
      className="font-semibold leading-none text-title inline-flex"
      style={{ fontFamily: 'var(--dev-title-font, var(--font-fira-sans))' }}
      layout
    >
      {chars.map((char, i) => {
        const isInitial = initialIndices.includes(i)

        if (isInitial) {
          // This character is one of the initials - always visible, animates position
          return (
            <motion.span
              key={`initial-${i}`}
              layout
              transition={{
                layout: { duration, ease: "easeInOut" }
              }}
              className="inline-block"
            >
              {char}
            </motion.span>
          )
        } else {
          // This character fades in/out based on showFullName
          return (
            <motion.span
              key={`char-${i}`}
              initial={false}
              animate={{
                opacity: showFullName ? 1 : 0,
                width: showFullName ? "auto" : 0,
              }}
              transition={{
                duration: duration * 0.7,
                ease: "easeInOut",
              }}
              className="inline-block overflow-hidden whitespace-pre"
            >
              {char}
            </motion.span>
          )
        }
      })}
    </motion.span>
  )
}

// Collapsible search component
function CollapsibleSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastQueryRef = useRef("")
  const shouldReduceMotion = useReducedMotion()

  // Pre-load SearchBar bundle on mount so first click is instant
  useEffect(() => {
    if (SearchBar && 'preload' in SearchBar) {
      (SearchBar as any).preload()
    }
  }, [])

  // Handle click outside to collapse
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Check if there's content in the search field
        const input = containerRef.current.querySelector('input')
        const currentHasContent = input ? input.value.trim().length > 0 : false

        // Collapse if empty, or if config says to always collapse
        if (!currentHasContent || siteConfig.header.collapseSearchOnClickAway) {
          lastQueryRef.current = input?.value ?? ""
          setIsOpen(false)
        }
      }
    }

    // Add a small delay to prevent immediate collapse when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!SearchBar) return null

  if (!siteConfig.header.collapsibleSearch) {
    return <div className="hidden sm:block"><SearchBar /></div>
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Magnifying glass — always occupies layout space, fades out when search is open */}
      <motion.button
        animate={{ opacity: isOpen ? 0 : 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
        onClick={() => !isOpen && setIsOpen(true)}
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
        className="p-2 rounded hover:bg-accent transition-colors"
        aria-label="Open search"
        aria-hidden={isOpen}
        tabIndex={isOpen ? -1 : 0}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </motion.button>

      {/* Search bar — absolutely positioned so it doesn't affect flex layout of the header */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="search-bar"
            className="absolute right-0 top-1/2 -translate-y-1/2 overflow-visible"
            initial={shouldReduceMotion ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.85 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={shouldReduceMotion ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.85 }}
            style={{ transformOrigin: 'right center' }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15, ease: "easeOut" }}
          >
            <SearchBar initialQuery={lastQueryRef.current} focusOnMount />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const { scrollDirection } = useScrollDirectionContext()
  const { data: seriesHeaderData } = useSeriesHeader()
  const isHome = pathname === "/"
  const { navAlignRight, showHomeLink } = siteConfig.header

  const isVisible = scrollDirection !== "down"

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full bg-background transition-all duration-300 ease-in-out overflow-visible",
      "motion-reduce:transition-none",
      scrollDirection === "down" ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
    )}>
      <div className={cn(
        "container flex h-16 items-center",
        navAlignRight ? "justify-between" : ""
      )}>
        {/* Site name / logo */}
        <div className={navAlignRight ? "" : "mr-8"}>
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => {
              // Scroll to top immediately when navigating home to prevent animation glitch
              if (window.scrollY > 0) {
                window.scrollTo({ top: 0, behavior: 'instant' })
              }
            }}
          >
            {siteConfig.header.logo && (
              <img
                src={siteConfig.header.logo}
                alt=""
                className="rounded-full"
                style={{
                  width: siteConfig.header.logoSize,
                  height: siteConfig.header.logoSize,
                  marginRight: siteConfig.header.logoGap,
                }}
              />
            )}
            <AnimatedName isHome={isHome} />
          </Link>
        </div>

        {/* Navigation and controls */}
        <div className={cn(
          "flex items-center",
          navAlignRight ? "gap-6" : "flex-1 justify-between"
        )}>
          <nav
            aria-label="Primary navigation"
            className={cn(
            "flex items-center space-x-6 text-nav font-medium",
            !navAlignRight && "flex-1"
          )}>
            {showHomeLink && (
              <Link
                href="/"
                className={cn(
                  "site-nav-link transition-colors hover:text-foreground/80",
                  pathname === "/" ? "text-foreground" : "text-foreground/60",
                )}
                onClick={() => {
                  if (window.scrollY > 0) {
                    window.scrollTo({ top: 0, behavior: 'instant' })
                  }
                }}
              >
                Home
              </Link>
            )}

            {siteConfig.pages.about && (
              <Link
                href="/about"
                className={cn(
                  "site-nav-link transition-colors hover:text-foreground/80",
                  pathname === "/about" ? "text-foreground" : "text-foreground/60",
                )}
              >
                About
              </Link>
            )}

            {siteConfig.pages.blog && (
              <Link
                href="/blog"
                className={cn(
                  "site-nav-link transition-colors hover:text-foreground/80",
                  (pathname?.startsWith("/blog") || pathname?.startsWith("/series")) ? "text-foreground" : "text-foreground/60",
                )}
              >
                Posts
              </Link>
            )}

            {siteConfig.pages.verse && (
              <Link
                href="/verse"
                className={cn(
                  "site-nav-link transition-colors hover:text-foreground/80",
                  pathname === "/verse" ? "text-foreground" : "text-foreground/60",
                )}
              >
                Verse
              </Link>
            )}
          </nav>

          <CollapsibleSearch />
        </div>
      </div>

      {/* Main header bottom border */}
      <div className="border-b" />

      {/* Series header - absolutely positioned so it doesn't create space in TOC column */}
      {seriesHeaderData && (
        <div
          className={cn(
            "hidden tablet:block",
            "absolute left-0 right-0",
            "transition-opacity duration-150 ease-in-out",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          data-series-header-visible={isVisible}
          style={{
            // Position at bottom of header, flush with border
            top: '100%',
          }}
        >
          {/* Series header content - offset to align with the post content grid column. */}
          <div
            className={cn(
              "series-header-content relative",
              uiConfig.series.header?.backgroundColor || "bg-background"
            )}
          >
            {/* Border line - extends from TOC right edge to page right edge */}
            <div
              className="series-header-border absolute bottom-0 h-px bg-border pointer-events-none"
            />
            {/* Nav content aligned to the article.prose body measure inside the content column. */}
            <nav
              className="series-header-nav mx-auto flex flex-col gap-0.5 py-1 text-sm"
              aria-label="Series navigation"
            >
              <div className="text-center leading-5">
                <Link
                  href={`/series/${seriesHeaderData.series.slug}`}
                  className="hover:text-foreground transition-colors no-underline"
                >
                  <span className="text-muted-foreground">Part {seriesHeaderData.currentIndex + 1} of </span>
                  <span className="font-medium text-foreground">{seriesHeaderData.series.title}</span>
                </Link>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-center leading-5">
                <div className="min-w-0">
                  {seriesHeaderData.prevPost ? (
                    <Link
                      href={`/series/${seriesHeaderData.series.slug}/${seriesHeaderData.prevPost.slug}`}
                      className="group inline-flex max-w-full min-w-0 items-center gap-1 text-muted-foreground hover:text-foreground transition-colors no-underline"
                    >
                      <span aria-hidden="true" className="shrink-0">←</span>
                      <span className="hidden min-w-0 truncate sm:inline">
                        {seriesHeaderData.prevPost.frontmatter.title}
                      </span>
                      <span className="sm:hidden">Prev</span>
                    </Link>
                  ) : null}
                </div>

                <div aria-hidden="true" />

                <div className="min-w-0 text-right">
                  {seriesHeaderData.nextPost ? (
                    <Link
                      href={`/series/${seriesHeaderData.series.slug}/${seriesHeaderData.nextPost.slug}`}
                      className="group inline-flex max-w-full min-w-0 items-center justify-end gap-1 text-muted-foreground hover:text-foreground transition-colors no-underline"
                    >
                      <span className="hidden min-w-0 truncate sm:inline">
                        {seriesHeaderData.nextPost.frontmatter.title}
                      </span>
                      <span className="sm:hidden">Next</span>
                      <span aria-hidden="true" className="shrink-0">→</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
