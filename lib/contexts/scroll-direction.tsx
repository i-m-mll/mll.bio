"use client"

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react"
import { uiConfig } from "@/lib/config/ui"

type ScrollDirection = "up" | "down" | null

interface ScrollDirectionContextValue {
  scrollDirection: ScrollDirection
}

const ScrollDirectionContext = createContext<ScrollDirectionContextValue | null>(null)

export function ScrollDirectionProvider({ children }: { children: ReactNode }) {
  const threshold = uiConfig.header.scrollThreshold
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>("up")
  const lastScrollYRef = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY

      // Always show header at the top of the page
      if (scrollY <= 0) {
        setScrollDirection("up")
        lastScrollYRef.current = 0
        ticking.current = false
        return
      }

      const delta = scrollY - lastScrollYRef.current

      // Only update direction if scroll delta exceeds threshold
      if (Math.abs(delta) > threshold) {
        const newDirection = delta > 0 ? "down" : "up"
        setScrollDirection(newDirection)
        lastScrollYRef.current = scrollY
      }

      ticking.current = false
    }

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking.current = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })

    // Initial check
    lastScrollYRef.current = window.scrollY

    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  }, [threshold])

  return (
    <ScrollDirectionContext.Provider value={{ scrollDirection }}>
      {children}
    </ScrollDirectionContext.Provider>
  )
}

export function useScrollDirectionContext() {
  const context = useContext(ScrollDirectionContext)
  if (!context) {
    throw new Error("useScrollDirectionContext must be used within ScrollDirectionProvider")
  }
  return context
}
