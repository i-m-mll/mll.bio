"use client"

import { useEffect, useState, useRef } from "react"

export function useScrollDirection(threshold: number = 5) {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(
    "up",
  )
  const lastScrollYRef = useRef(0)
  const isManualScroll = useRef(false)

  useEffect(() => {
    const updateScrollDirection = () => {
      // Always show header at the top of the page
      const scrollY = window.pageYOffset
      if (scrollY === 0) {
        setScrollDirection("up")
        lastScrollYRef.current = 0
        return
      }

      // Only update if the scroll was user-initiated
      if (!isManualScroll.current) return

      const direction = scrollY > lastScrollYRef.current ? "down" : "up"

      if (
        direction !== scrollDirection &&
        Math.abs(scrollY - lastScrollYRef.current) > threshold
      ) {
        setScrollDirection(direction)
      }

      lastScrollYRef.current = scrollY
      isManualScroll.current = false // Reset the flag after handling
    }

    const onScroll = () => {
      window.requestAnimationFrame(updateScrollDirection)
    }

    const markAsManualScroll = () => {
      isManualScroll.current = true
    }

    const keysCausingScroll = new Set([
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      " ", // space bar
    ])

    const onKeyDown = (e: KeyboardEvent) => {
      if (keysCausingScroll.has(e.key)) {
        markAsManualScroll()
      }
    }

    // Listen for the scroll event itself
    window.addEventListener("scroll", onScroll, { passive: true })
    // Listen for user input events to flag the scroll as manual
    window.addEventListener("wheel", markAsManualScroll, { passive: true })
    window.addEventListener("touchmove", markAsManualScroll, { passive: true })
    window.addEventListener("keydown", onKeyDown, { passive: true })

    // Initial check
    updateScrollDirection()

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("wheel", markAsManualScroll)
      window.removeEventListener("touchmove", markAsManualScroll)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [scrollDirection, threshold])

  return scrollDirection
} 