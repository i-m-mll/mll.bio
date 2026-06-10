import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ThemeProvider } from "@/components/theme-provider"
import { UiConfigProvider } from "@/components/ui-config-provider"
import { ScrollDirectionProvider } from "@/lib/contexts/scroll-direction"
import { SeriesHeaderProvider } from "@/lib/contexts/series-header"
import { CodeThemeStyles } from "@/components/CodeThemeStyles"
import { siteConfig } from "@/lib/config/site"
import { inter, roboto, roboto_mono, source_serif, fira_sans } from "@/lib/fonts"
import DevFontSwitcher from "@/components/DevFontSwitcher"
import { uiConfig } from "@/lib/config/ui"

export const metadata: Metadata = {
  metadataBase: new URL('https://mll.bio'),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [
    {
      name: siteConfig.author,
      url: siteConfig.url,
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No per-request cookie reading in static export; theme class set by JS only
  const initialThemeClass = ""
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`no-js ${initialThemeClass} ${inter.variable} ${roboto.variable} ${roboto_mono.variable} ${source_serif.variable} ${fira_sans.variable}`}
    >
      <head>
        <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.remove('no-js');document.documentElement.classList.add('js');",
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-body">
        <ThemeProvider>
          <ScrollDirectionProvider>
            <SeriesHeaderProvider>
              <UiConfigProvider />
              {/* Inject highlight.js themes at build time */}
              <CodeThemeStyles />
              <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1">{children}</main>
                <SiteFooter />
                {process.env.NODE_ENV !== 'production' && uiConfig.devTools.fontSwitcher && <DevFontSwitcher />}
              </div>
            </SeriesHeaderProvider>
          </ScrollDirectionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
