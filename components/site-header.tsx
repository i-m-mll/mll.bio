"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { siteConfig } from "@/lib/config/site"
import { uiConfig } from "@/lib/config/ui"
import { cn } from "@/lib/utils"
import { useScrollDirection } from "@/lib/hooks"
import { ModeToggle } from "@/components/mode-toggle"
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

  const fullName = siteConfig.fullName || siteConfig.name
  const shortName = siteConfig.name

  // Show full name only on homepage AND when viewport is wide enough
  const showFullName = isHome && !isNarrow

  // If animation is disabled, just show the appropriate name
  if (!animateName) {
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
                filter: showFullName ? "blur(0px)" : "blur(4px)",
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
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <SearchBar />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-accent transition-colors"
                aria-label="Close search"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="p-2 rounded hover:bg-accent transition-colors"
            aria-label="Open search"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const scrollDirection = useScrollDirection(uiConfig.header.scrollThreshold)
  const isHome = pathname === "/"
  const { navAlignRight, showHomeLink } = siteConfig.header

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background transition-all duration-300 ease-in-out overflow-visible",
      scrollDirection === "down" ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
    )}>
      <div className={cn(
        "container flex h-16 items-center",
        navAlignRight ? "justify-between" : ""
      )}>
        {/* Site name / logo */}
        <div className={navAlignRight ? "" : "mr-8"}>
          <Link href="/" className="flex items-center">
            <AnimatedName isHome={isHome} />
          </Link>
        </div>

        {/* Navigation and controls */}
        <div className={cn(
          "flex items-center",
          navAlignRight ? "gap-6" : "flex-1 justify-between"
        )}>
          <nav className={cn(
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

          <div className="flex items-center space-x-4">
            <CollapsibleSearch />
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
