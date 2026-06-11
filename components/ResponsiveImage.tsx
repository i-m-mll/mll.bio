import React from "react"
import fs from "node:fs"
import pathMod from "node:path"
import { getImageManifest, type ManifestEntry, type RasterEntry, type SvgEntry } from "@/lib/image-manifest"

const manifest: Record<string, ManifestEntry> = getImageManifest()

function isRasterEntry(entry: ManifestEntry | undefined): entry is RasterEntry {
  return Boolean(entry && !Array.isArray(entry) && "variants" in entry)
}

function isSvgEntry(entry: ManifestEntry | undefined): entry is SvgEntry {
  return Boolean(entry && !Array.isArray(entry) && "path" in entry)
}

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {}

const ResponsiveImage: React.FC<Props> = ({ src = "", alt = "", ...rest }) => {
  let entry = manifest[src as string]
  if (!entry) {
    // try fuzzy match for relative paths (./foo.jpg)
    const clean = (src as string).replace(/^\.\/?/, '')
    const foundKey = Object.keys(manifest).find((k) => k.endsWith(clean))
    if (foundKey) entry = manifest[foundKey]
  }
  const variants = Array.isArray(entry) ? entry : (isRasterEntry(entry) ? entry.variants : [])
  const width = !Array.isArray(entry) && entry && "width" in entry ? entry.width : undefined
  const height = !Array.isArray(entry) && entry && "height" in entry ? entry.height : undefined

  if (!entry || (variants.length === 0 && !isSvgEntry(entry))) {
    // Fallback to original
    return <img src={src} alt={alt} loading="lazy" {...rest} />
  }

  if (isSvgEntry(entry)) {
    // SVG entry - inline the SVG so text inside is selectable and stylable
    const svgEntry = entry as SvgEntry
    try {
      const abs = pathMod.join(process.cwd(), svgEntry.path)
      const svgContent = fs.readFileSync(abs, "utf8")
      return (
        <span
          role="img"
          aria-label={alt}
          dangerouslySetInnerHTML={{ __html: svgContent }}
          {...rest}
        />
      )
    } catch {
      // Fallback if read fails
      return <img src={svgEntry.path} alt={alt} width={width} height={height} loading="lazy" {...rest} />
    }
  }

  const avifSet = variants.map((e) => `${e.avif} ${e.w}w`).join(", ")
  const webpSet = variants.map((e) => `${e.webp} ${e.w}w`).join(", ")
  const fallback = variants[variants.length - 1].webp
  return (
    <picture>
      <source type="image/avif" srcSet={avifSet} sizes="(min-width: 1051px) 48rem, calc(100vw - 2rem)" />
      <source type="image/webp" srcSet={webpSet} sizes="(min-width: 1051px) 48rem, calc(100vw - 2rem)" />
      <img
        src={fallback}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 1051px) 48rem, calc(100vw - 2rem)"
        loading="lazy"
        decoding="async"
        {...rest}
      />
    </picture>
  )
}

export default ResponsiveImage
