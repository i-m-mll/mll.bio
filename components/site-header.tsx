"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { siteConfig } from "@/lib/config/site"
import { uiConfig } from "@/lib/config/ui"
import { cn } from "@/lib/utils"
import { useScrollDirection } from "@/lib/hooks"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader() {
  const pathname = usePathname()
  const scrollDirection = useScrollDirection(uiConfig.header.scrollThreshold)

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background transition-transform duration-300 ease-in-out",
      scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
    )}>
      <div className="container flex h-16 items-center">
        <div className="mr-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold leading-none text-title" style={{ fontFamily: 'var(--dev-title-font, et-book)' }}>{siteConfig.name}</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-nav font-medium flex-1">
          <Link
            href="/"
            className={cn(
              "site-nav-link transition-colors hover:text-foreground/80",
              pathname === "/" ? "text-foreground" : "text-foreground/60",
            )}
          >
            Home
          </Link>

          {siteConfig.pages.blog && (
            <Link
              href="/blog"
              className={cn(
                "site-nav-link transition-colors hover:text-foreground/80",
                pathname?.startsWith("/blog") ? "text-foreground" : "text-foreground/60",
              )}
            >
              Posts
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
        </nav>
        <div className="flex items-center">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
