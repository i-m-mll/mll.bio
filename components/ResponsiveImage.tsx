import React from "react"
import fs from "node:fs"
import pathMod from "node:path"

// Manifest entry can be either an array of responsive variants (for raster images)
// or an object with a path property (for SVGs that are inlined)
type RasterVariant = { w: number; webp: string; avif: string }
type SvgEntry = { path: string }
type ManifestEntry = RasterVariant[] | SvgEntry

const manifest: Record<string, ManifestEntry> = require("../generated/image-manifest.json")

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {}

const ResponsiveImage: React.FC<Props> = ({ src = "", alt = "", ...rest }) => {
  let entry = manifest[src as string]
  if (!entry) {
    // try fuzzy match for relative paths (./foo.jpg)
    const clean = (src as string).replace(/^\.\/?/, '')
    const foundKey = Object.keys(manifest).find((k) => k.endsWith(clean))
    if (foundKey) entry = manifest[foundKey]
  }
  if (!entry || (Array.isArray(entry) && entry.length === 0)) {
    // Fallback to original
    return <img src={src} alt={alt} loading="lazy" {...rest} />
  }

  if (!Array.isArray(entry)) {
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
      return <img src={svgEntry.path} alt={alt} loading="lazy" {...rest} />
    }
  }

  const avifSet = entry.map((e) => `${e.avif} ${e.w}w`).join(", ")
  const webpSet = entry.map((e) => `${e.webp} ${e.w}w`).join(", ")
  const fallback = entry[entry.length - 1].webp
  return (
    <picture>
      <source type="image/avif" srcSet={avifSet} />
      <source type="image/webp" srcSet={webpSet} />
      <img src={fallback} alt={alt} loading="lazy" {...rest} />
    </picture>
  )
}

export default ResponsiveImage
