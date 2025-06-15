import { siteConfig } from "@/lib/config"

export function SiteFooter() {
  return (
    <footer className="border-t footer-container">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {siteConfig.name}, {new Date().getFullYear()} 
        </p>
        <p className="text-sm text-muted-foreground"></p>
      </div>
    </footer>
  )
}
