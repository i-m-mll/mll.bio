"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

interface MdxImageProps {
  src: string
  alt?: string
  title?: string
}

/**
 * Client-side image component for MDX content.
 * Handles dark mode SVG switching and centers images.
 */
export function MdxImage({ src, alt = "", title, ...rest }: MdxImageProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // For SVGs in dark mode, use the -dark.svg variant
  const isSvg = src.toLowerCase().endsWith('.svg')
  const useDarkVariant = mounted && resolvedTheme === 'dark' && isSvg
  const actualSrc = useDarkVariant
    ? src.replace(/\.svg$/i, '-dark.svg')
    : src

  return (
    <span className="block my-6 flex justify-center">
      <img src={actualSrc} alt={alt} title={title} className="rounded-md" {...rest} />
    </span>
  )
}
