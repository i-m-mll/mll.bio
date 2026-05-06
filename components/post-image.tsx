import { MdxImage } from "@/components/mdx-image"

// Manifest entry types (mirrors ResponsiveImage.tsx)
type RasterVariant = { w: number; webp: string; avif: string }
type SvgEntry = { path: string }
type ManifestEntry = RasterVariant[] | SvgEntry

const manifest: Record<string, ManifestEntry> = require("../generated/image-manifest.json")

interface PostImageProps {
  src?: string
  alt?: string
  title?: string
  [key: string]: any
}

/**
 * Server component: default img handler for MDX content.
 *
 * - Raster images present in the image manifest → <picture> with AVIF/WebP srcsets.
 * - Everything else (SVGs, images not in manifest) → MdxImage (client component
 *   that handles dark-mode SVG switching and centering).
 */
export function PostImage({ src = "", alt = "", title, ...rest }: PostImageProps) {
  // Look up the src in the manifest, with fuzzy-match fallback for relative paths
  let entry = manifest[src]
  if (!entry) {
    const clean = src.replace(/^\.\/?/, "")
    const foundKey = Object.keys(manifest).find((k) => k.endsWith(clean))
    if (foundKey) entry = manifest[foundKey]
  }

  // If it's a raster image in the manifest, render an optimised <picture> element
  if (entry && Array.isArray(entry) && entry.length > 0) {
    const avifSet = entry.map((e) => `${e.avif} ${e.w}w`).join(", ")
    const webpSet = entry.map((e) => `${e.webp} ${e.w}w`).join(", ")
    const fallback = entry[entry.length - 1].webp

    return (
      <span className="block my-6 flex justify-center">
        <picture>
          <source type="image/avif" srcSet={avifSet} />
          <source type="image/webp" srcSet={webpSet} />
          <img
            src={fallback}
            alt={alt}
            title={title}
            className="rounded-md"
            loading="lazy"
            {...rest}
          />
        </picture>
      </span>
    )
  }

  // SVGs, images not in the manifest, and any other fallback → MdxImage
  return <MdxImage src={src} alt={alt} title={title} {...rest} />
}
