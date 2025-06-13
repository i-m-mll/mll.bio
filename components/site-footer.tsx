import { siteConfig } from "@/lib/config"

export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <p className="text-sm text-muted-foreground">Built with Next.js</p>
      </div>
    </footer>
  )
}
