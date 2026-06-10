import type { Metadata } from "next"
import { siteConfig } from "@/lib/config/site"

const DEFAULT_OG_IMAGE = "/egg1.png"
const DEFAULT_OG_IMAGE_WIDTH = 1441
const DEFAULT_OG_IMAGE_HEIGHT = 1441

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString()
}

export function canonicalPath(path = "/") {
  return path.startsWith("/") ? path : `/${path}`
}

export function defaultOpenGraphImage(path = DEFAULT_OG_IMAGE) {
  return {
    url: path,
    width: DEFAULT_OG_IMAGE_WIDTH,
    height: DEFAULT_OG_IMAGE_HEIGHT,
    alt: `${siteConfig.name} site icon`,
  }
}

export function buildPageMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  ogImage,
  type = "website",
}: {
  title?: string
  description?: string
  path?: string
  ogImage?: string
  type?: "website" | "article"
}): Metadata {
  const canonical = canonicalPath(path)
  const image = ogImage ? { url: ogImage } : defaultOpenGraphImage()

  const metadata: Metadata = {
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type,
      title: title || siteConfig.name,
      description,
      url: canonical,
      siteName: siteConfig.name,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: title || siteConfig.name,
      description,
      images: [ogImage || DEFAULT_OG_IMAGE],
    },
  }

  if (title) metadata.title = title

  return metadata
}

export function jsonLdScript(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  }
}
