import { MdxImage } from "@/components/mdx-image"

// Manifest entry types (mirrors ResponsiveImage.tsx)
type RasterVariant = { w: number; webp: string; avif: string }
type RasterEntry = { width?: number; height?: number; variants: RasterVariant[] }
type SvgEntry = { path: string; width?: number; height?: number }
type ManifestEntry = RasterVariant[] | RasterEntry | SvgEntry

const manifest: Record<string, ManifestEntry> = require("../generated/image-manifest.json")

function isRasterEntry(entry: ManifestEntry | undefined): entry is RasterEntry {
  return Boolean(entry && !Array.isArray(entry) && "variants" in entry)
}

function isSvgEntry(entry: ManifestEntry | undefined): entry is SvgEntry {
  return Boolean(entry && !Array.isArray(entry) && "path" in entry)
}

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
 * - Everything else (SVGs, images not in manifest) -> MdxImage (client component
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
  const variants = Array.isArray(entry) ? entry : (isRasterEntry(entry) ? entry.variants : [])
  const width = !Array.isArray(entry) && entry && "width" in entry ? entry.width : undefined
  const height = !Array.isArray(entry) && entry && "height" in entry ? entry.height : undefined

  if (variants.length > 0) {
    const avifSet = variants.map((e) => `${e.avif} ${e.w}w`).join(", ")
    const webpSet = variants.map((e) => `${e.webp} ${e.w}w`).join(", ")
    const fallback = variants[variants.length - 1].webp

    return (
      <span className="block my-6 flex justify-center">
        <picture>
          <source type="image/avif" srcSet={avifSet} sizes="(min-width: 1051px) 48rem, calc(100vw - 2rem)" />
          <source type="image/webp" srcSet={webpSet} sizes="(min-width: 1051px) 48rem, calc(100vw - 2rem)" />
          <img
            src={fallback}
            alt={alt}
            title={title}
            className="rounded-md max-w-full h-auto"
            width={width}
            height={height}
            sizes="(min-width: 1051px) 48rem, calc(100vw - 2rem)"
            loading="lazy"
            decoding="async"
            {...rest}
          />
        </picture>
      </span>
    )
  }

  if (isSvgEntry(entry)) {
    return (
      <MdxImage
        src={src}
        alt={alt}
        title={title}
        width={entry.width}
        height={entry.height}
        {...rest}
      />
    )
  }

  // SVGs, images not in the manifest, and any other fallback -> MdxImage
  return <MdxImage src={src} alt={alt} title={title} {...rest} />
}
