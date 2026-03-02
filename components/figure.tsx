"use client"

import { ReactNode, useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { useMediaQuery } from "../hooks/use-media-query"
import tailwindConfig from "../tailwind.config"

interface FigureProps {
  src: string
  alt?: string
  caption?: ReactNode
  children?: ReactNode // Alternative way to pass caption
  /** Explicitly disable dark mode SVG switching (e.g., if no dark variant exists). */
  noDarkVariant?: boolean
}

export function Figure({ src, alt = "", caption, children, noDarkVariant }: FigureProps) {
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

  // Mobile/SSR: caption below image
  if (!mounted || !isDesktop) {
    return (
      <figure className="my-6 flex flex-col items-center">
        <img src={actualSrc} alt={alt} className="rounded-md" />
        {captionContent && (
          <figcaption className="mt-4 text-sm text-muted-foreground italic text-left max-w-[calc(100%-3rem)]">
            {captionContent}
          </figcaption>
        )}
      </figure>
    )
  }

  // Desktop: caption as margin note, vertically centered with figure
  return (
    <figure ref={figureRef} className="my-6 relative flex justify-center">
      <img src={actualSrc} alt={alt} className="rounded-md" />
      {captionContent && (
        <figcaption
          className="figure-margin-caption absolute text-muted-foreground italic"
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
