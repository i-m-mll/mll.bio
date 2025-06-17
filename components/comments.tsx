"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { siteConfig } from "@/lib/config/site"

export function Comments({ title }: { title: string }) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only render Giscus after component is mounted on the client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render comments if not configured
  if (!siteConfig.comments.provider || !mounted) {
    return null
  }

  // Only support Giscus for now
  if (siteConfig.comments.provider !== "giscus") {
    return null
  }

  const { repo, repoId, category, categoryId, mapping, reactionsEnabled, emitMetadata, inputPosition, lang } =
    siteConfig.comments.giscus

  // Don't render if required config is missing
  if (!repo || !repoId || !category || !categoryId) {
    return (
      <div className="text-sm text-muted-foreground mt-10 p-4 border rounded-md">
        <p>Comments are not configured properly. Please check your site configuration.</p>
      </div>
    )
  }

  return (
    <section className="mt-10 pt-10 border-t">
      <h2 className="text-2xl font-bold mb-4">Comments</h2>
      <div className="giscus-wrapper">
        <script
          src="https://giscus.app/client.js"
          data-repo={repo}
          data-repo-id={repoId}
          data-category={category}
          data-category-id={categoryId}
          data-mapping={mapping || "pathname"}
          data-reactions-enabled={reactionsEnabled ? "1" : "0"}
          data-emit-metadata={emitMetadata ? "1" : "0"}
          data-input-position={inputPosition || "bottom"}
          data-lang={lang || "en"}
          data-theme={theme === "dark" ? "dark" : "light"}
          data-loading="lazy"
          crossOrigin="anonymous"
          async
        ></script>
      </div>
    </section>
  )
}
