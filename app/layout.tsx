import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ThemeProvider } from "@/components/theme-provider"
import { UiConfigProvider } from "@/components/ui-config-provider"
import { CodeThemeLoader } from "@/components/code-theme-loader"
import { siteConfig } from "@/lib/config/site"
import { inter, roboto, roboto_mono, source_serif } from "@/lib/fonts"
import DevFontSwitcher from "@/components/DevFontSwitcher"
import { uiConfig } from "@/lib/config/ui"

export const metadata: Metadata = {
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
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${inter.variable} ${roboto.variable} ${roboto_mono.variable} ${source_serif.variable}`}
    >
      <head>
        <link href="https://iosevka-webfonts.github.io/iosevka/iosevka.css" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-body">
        <ThemeProvider>
          <UiConfigProvider />
          <CodeThemeLoader />
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            {process.env.NODE_ENV !== 'production' && uiConfig.devTools.fontSwitcher && <DevFontSwitcher />}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
