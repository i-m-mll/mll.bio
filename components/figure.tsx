"use client"

import { ReactNode, useState, useEffect, useRef } from "react"
import { useMediaQuery } from "../hooks/use-media-query"
import tailwindConfig from "../tailwind.config"

interface FigureProps {
  src: string
  alt?: string
  caption?: ReactNode
  children?: ReactNode // Alternative way to pass caption
  /** Whether to add a light background in dark mode (useful for SVGs with white backgrounds). Auto-detected for SVG files. */
  lightBg?: boolean
}

export function Figure({ src, alt = "", caption, children, lightBg }: FigureProps) {
  const isDesktop = useMediaQuery(`(min-width: ${tailwindConfig.theme.screens.desktop})`)
  const [mounted, setMounted] = useState(false)
  const figureRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const captionContent = caption || children

  // Auto-detect if we need light background for SVGs (unless explicitly set)
  const needsLightBg = lightBg ?? src.toLowerCase().endsWith('.svg')

  // Mobile/SSR: caption below image
  if (!mounted || !isDesktop) {
    return (
      <figure className="my-6 flex flex-col items-center">
        <div className={needsLightBg ? "rounded-md dark:bg-stone-100 dark:p-3" : ""}>
          <img src={src} alt={alt} className="rounded-md" />
        </div>
        {captionContent && (
          <figcaption className="mt-4 text-sm text-muted-foreground italic self-start ml-6 max-w-[calc(100%-4rem)]">
            {captionContent}
          </figcaption>
        )}
      </figure>
    )
  }

  // Desktop: caption as margin note, vertically centered with figure
  return (
    <figure ref={figureRef} className="my-6 relative flex justify-center">
      <div className={needsLightBg ? "rounded-md dark:bg-stone-100 dark:p-3" : ""}>
        <img src={src} alt={alt} className="rounded-md" />
      </div>
      {captionContent && (
        <figcaption
          className="figure-margin-caption absolute text-muted-foreground italic"
          style={{
            right: 'calc(-1 * var(--sidenote-area-width) + var(--sidenote-margin-offset))',
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
