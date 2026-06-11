"use client"

import { ReactNode, useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { useMediaQuery } from "../hooks/use-media-query"
import tailwindConfig from "../tailwind.config"
import { inferDimensionsFromSrc } from "@/lib/image-dimensions"

type RasterVariant = { w: number; webp: string; avif: string }
type RasterEntry = { width?: number; height?: number; variants: RasterVariant[] }
type SvgEntry = { path: string; width?: number; height?: number }
type ManifestEntry = RasterVariant[] | RasterEntry | SvgEntry

const manifest: Record<string, ManifestEntry> = require("../generated/image-manifest.json")

interface FigureProps {
  src: string
  alt?: string
  caption?: ReactNode
  children?: ReactNode // Alternative way to pass caption
  /** Explicitly disable dark mode SVG switching (e.g., if no dark variant exists). */
  noDarkVariant?: boolean
  width?: number
  height?: number
}

export function Figure({ src, alt = "", caption, children, noDarkVariant, width, height }: FigureProps) {
  const isDesktop = useMediaQuery(`(min-width: ${tailwindConfig.theme.screens.desktop})`)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const figureRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const captionContent = caption || children

  // For SVGs in dark mode, use the -dark.svg variant
  const isSvg = src.toLowerCase().endsWith('.svg')
  const useDarkVariant = mounted && resolvedTheme === 'dark' && isSvg && !noDarkVariant
  const actualSrc = useDarkVariant
    ? src.replace(/\.svg$/i, '-dark.svg')
    : src
  const manifestEntry = manifest[src] ?? manifest[actualSrc]
  const manifestWidth = !Array.isArray(manifestEntry) && manifestEntry && "width" in manifestEntry ? manifestEntry.width : undefined
  const manifestHeight = !Array.isArray(manifestEntry) && manifestEntry && "height" in manifestEntry ? manifestEntry.height : undefined
  const inferred = inferDimensionsFromSrc(src)
  const imageWidth = width ?? manifestWidth ?? inferred.width
  const imageHeight = height ?? manifestHeight ?? inferred.height
  const image = (
    <img
      src={actualSrc}
      alt={alt}
      className="rounded-md max-w-full h-auto"
      width={imageWidth}
      height={imageHeight}
      loading="lazy"
      decoding="async"
    />
  )

  // Mobile/SSR: caption below image
  if (!mounted || !isDesktop) {
    return (
      <figure className="my-6 flex flex-col items-center">
        {image}
        {captionContent && (
          <figcaption className="mt-4 text-sm text-left max-w-[calc(100%-3rem)]">
            {captionContent}
          </figcaption>
        )}
      </figure>
    )
  }

  // Desktop: caption as margin note, vertically centered with figure
  return (
    <figure ref={figureRef} className="my-6 relative flex justify-center">
      {image}
      {captionContent && (
        <figcaption
          className="figure-margin-caption absolute"
          style={{
            right: 'calc(-1 * min(var(--sidenote-area-width), calc(var(--sidenote-max-width) + var(--sidenote-width-offset))) + var(--sidenote-margin-offset) + var(--callout-padding-right, 0px))',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'calc(var(--sidenote-area-width) - var(--sidenote-width-offset))',
            minWidth: 'var(--sidenote-min-width)',
            maxWidth: 'var(--sidenote-max-width)',
            fontSize: 'var(--sidenote-font-size)',
            lineHeight: 'var(--sidenote-line-height)',
          }}
        >
          {captionContent}
        </figcaption>
      )}
    </figure>
  )
}
