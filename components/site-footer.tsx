import { siteConfig } from "@/lib/config/site"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 footer-container">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {siteConfig.name}, {new Date().getFullYear()}
        </p>
        <ModeToggle size="sm" />
      </div>
    </footer>
  )
}
