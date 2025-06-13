"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { siteConfig } from "@/lib/config"
import { uiConfig } from "@/lib/ui-config"
import { cn, useScrollDirection } from "@/lib/utils"
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
            <span className="font-bold text-xl">{siteConfig.name}</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          <Link
            href="/"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/" ? "text-foreground" : "text-foreground/60",
            )}
          >
            Home
          </Link>

          {siteConfig.pages.blog && (
            <Link
              href="/blog"
              className={cn(
                "transition-colors hover:text-foreground/80",
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
                "transition-colors hover:text-foreground/80",
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
