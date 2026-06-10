"use client"

import { siteConfig } from "@/lib/config/site"
import { uiConfig } from "@/lib/config/ui"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const ICON_PATHS = {
  github: "M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.18 1.18A11.1 11.1 0 0 1 12 6.03c.98 0 1.97.13 2.89.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.42.36.78 1.06.78 2.14v3.15c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z",
  substack: "M3.75 2.75h16.5v2.5H3.75v-2.5Zm0 4.5h16.5v2.5H3.75v-2.5Zm0 4.5h16.5v9.5L12 16.62 3.75 21.25v-9.5Z",
  X: "M14.28 10.16 22.22 1h-1.88l-6.89 7.95L7.94 1H1.6l8.33 12.04L1.6 22.65h1.88l7.28-8.4 5.82 8.4h6.34l-8.64-12.49Zm-2.58 2.98-.84-1.2L4.14 2.41h2.9l5.42 7.69.84 1.2 7.05 10h-2.9l-5.75-8.16Z",
  bluesky: "M5.42 4.62C8.09 6.63 10.95 10.7 12 12.89c1.05-2.19 3.91-6.26 6.58-8.27 1.93-1.45 5.05-2.57 5.05 1 0 .71-.41 5.98-.65 6.84-.84 3-3.89 3.77-6.6 3.31 4.74.81 5.94 3.5 3.34 6.19-4.95 5.12-7.12-1.28-7.67-2.92-.1-.3-.15-.44-.15-.32 0-.12-.05.02-.15.32-.55 1.64-2.72 8.04-7.67 2.92-2.6-2.69-1.4-5.38 3.34-6.19-2.71.46-5.76-.31-6.6-3.31-.24-.86-.65-6.13-.65-6.84 0-3.57 3.12-2.45 5.05-1Z",
  mastodon: "M21.47 13.91c-.31 1.59-2.8 3.33-5.66 3.67-1.49.18-2.96.34-4.52.27-2.55-.11-4.56-.61-4.56-.61 0 .25.02.49.05.72.35 2.66 2.5 2.82 4.54 2.9 2.06.07 3.89-.51 3.89-.51l.08 1.86s-1.44.77-4 .91c-1.41.08-3.15-.04-5.19-.57-4.42-1.16-5.18-5.82-5.29-10.55-.03-1.4-.01-2.73-.01-3.83 0-4.85 3.18-6.27 3.18-6.27C5.58 1.16 8.32.84 11.25.82h.07c2.93.02 5.67.34 7.27 1.08 0 0 3.18 1.42 3.18 6.27 0 0 .04 3.58-.3 5.74ZM18.4 8.53c0-1.2-.3-2.16-.91-2.87-.63-.71-1.45-1.08-2.48-1.08-1.18 0-2.08.45-2.69 1.34l-.58.97-.58-.97c-.61-.89-1.51-1.34-2.69-1.34-1.03 0-1.85.37-2.48 1.08-.61.71-.91 1.67-.91 2.87v5.88h2.33V8.7c0-1.2.51-1.81 1.53-1.81 1.13 0 1.7.73 1.7 2.18v3.13h2.32V9.07c0-1.45.57-2.18 1.7-2.18 1.02 0 1.53.61 1.53 1.81v5.71h2.33V8.53Z",
  discord: "M20.32 4.37A19.8 19.8 0 0 0 15.36 2.8l-.24.48a18.4 18.4 0 0 1 4.4 2.2 13.9 13.9 0 0 0-5.31-1.05h-.41a13.9 13.9 0 0 0-5.31 1.05 18.4 18.4 0 0 1 4.4-2.2l-.24-.48a19.8 19.8 0 0 0-4.96 1.57C4.56 9.04 3.7 13.6 4.12 18.1a19.9 19.9 0 0 0 6.08 3.09l.73-1.01a13 13 0 0 1-3.82-1.83l.91-.69c1.79.84 3.67 1.26 5.98 1.26s4.19-.42 5.98-1.26l.91.69a13 13 0 0 1-3.82 1.83l.73 1.01a19.9 19.9 0 0 0 6.08-3.09c.5-5.21-.85-9.73-3.56-13.73ZM9.62 15.35c-1.15 0-2.09-1.06-2.09-2.36s.92-2.36 2.09-2.36c1.18 0 2.12 1.07 2.09 2.36 0 1.3-.92 2.36-2.09 2.36Zm6.76 0c-1.15 0-2.09-1.06-2.09-2.36s.92-2.36 2.09-2.36c1.18 0 2.12 1.07 2.09 2.36 0 1.3-.91 2.36-2.09 2.36Z",
} as const

function SimpleIcon({ name, size }: { name: keyof typeof ICON_PATHS; size: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}

export function SocialLinks() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before applying theme-dependent styling
  useEffect(() => {
    setMounted(true)
  }, [])

  const iconSize = `${uiConfig.socialLinks.iconSizeRem}rem`
  const defaultOpacity = uiConfig.socialLinks.iconOpacityDefault
  const hoverOpacity = uiConfig.socialLinks.iconOpacityHover
  
  // Helpers -------------------------------------------------------------
  const isDarkMode = mounted && resolvedTheme === "dark"

  // Calculate a complementary medium-gray for the current theme using the
  // same opacity parameters.  In light mode we darken (towards black); in
  // dark mode we lighten (towards white).
  const getDefaultLabelColor = () => {
    if (!mounted) {
      // Return light theme default during SSR/before mount
      const grayValue = Math.round(170 * (1 - defaultOpacity))
      return `rgb(${grayValue}, ${grayValue}, ${grayValue})`
    }
    
    if (isDarkMode) {
      // Light gray on dark background
      const grayValue = 255 - Math.round(170 * (1 - defaultOpacity))
      return `rgb(${grayValue}, ${grayValue}, ${grayValue})`
    }
    // Medium gray on light background
    const grayValue = Math.round(170 * (1 - defaultOpacity))
    return `rgb(${grayValue}, ${grayValue}, ${grayValue})`
  }

  const getHoverLabelColor = () => {
    if (!mounted) return "#000000" // Default to light theme color
    return isDarkMode ? "#ffffff" : "#000000"
  }

  const socialIcons: Record<string, { src?: string, label: string, svg?: JSX.Element }> = {
    github: {
      label: "GitHub",
      svg: <SimpleIcon name="github" size={iconSize} />,
    },
    manifold: {
      label: "Manifold",
      src: "/manifold.svg"
    },
    substack: {
      label: "Substack",
      svg: <SimpleIcon name="substack" size={iconSize} />,
    },
    X: {
      label: "X",
      svg: <SimpleIcon name="X" size={iconSize} />,
    },
    bluesky: {
      label: "Bluesky",
      svg: <SimpleIcon name="bluesky" size={iconSize} />,
    },
    mastodon: {
      label: "Mastodon",
      svg: <SimpleIcon name="mastodon" size={iconSize} />,
    },
    linkedin: {
      src: "/InBug-Black.png",
      label: "LinkedIn"
    },
    discord: {
      label: "Discord",
      svg: <SimpleIcon name="discord" size={iconSize} />,
    },
    email: {
      label: "Email",
      svg: (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      )
    }
  }

  const showBorder = siteConfig.homepage.socialLinksBorder

  return (
    <div
      className={`mx-auto w-full p-4 rounded-md bg-stone-75 dark:bg-stone-925 flex flex-wrap justify-evenly ${showBorder ? 'border border-stone-200 dark:border-stone-700' : ''}`}
      style={{ maxWidth: 'var(--content-width)' }}
    >
      {Object.entries(siteConfig.social).map(([key, url]) => {
        if (!url) return null
        
        const iconConfig = socialIcons[key]
        if (!iconConfig) return null

        const isEmail = key === 'email'
        const href = isEmail ? `mailto:${url}` : url
        const needsTargetBlank = !isEmail

        const handleMouseEnter = (e: React.MouseEvent) => {
          const iconContainer = e.currentTarget.querySelector('[data-icon]') as HTMLElement
          const textLabel = e.currentTarget.querySelector('span') as HTMLElement
          
          if (iconContainer) {
            iconContainer.style.opacity = hoverOpacity.toString()
            if (iconConfig.svg) {
              iconContainer.style.color = getHoverLabelColor()
            }
          }
          
          if (textLabel) {
            textLabel.style.color = getHoverLabelColor()
          }
        }

        const handleMouseLeave = (e: React.MouseEvent) => {
          const iconContainer = e.currentTarget.querySelector('[data-icon]') as HTMLElement
          const textLabel = e.currentTarget.querySelector('span') as HTMLElement
          
          if (iconContainer) {
            resetIconOpacity(iconContainer)
            if (iconConfig.svg) {
              iconContainer.style.color = getDefaultLabelColor()
            }
          }
          
          if (textLabel) {
            textLabel.style.color = getDefaultLabelColor()
          }
        }

        // Helper to reset icon opacity to default
        const resetIconOpacity = (iconEl: HTMLElement) => {
          iconEl.style.opacity = defaultOpacity.toString()
        }

        return (
          <Link
            key={key}
            href={href}
            {...(needsTargetBlank && { target: "_blank", rel: "noopener noreferrer" })}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-background transition-colors duration-200 group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="transition-all duration-200">
              {iconConfig.svg ? (
                <div
                  data-icon
                  className="transition-all duration-200"
                  style={{
                    opacity: defaultOpacity,
                    color: getDefaultLabelColor(),
                  }}
                >
                  {iconConfig.svg}
                </div>
              ) : (
                <img
                  data-icon
                  src={iconConfig.src}
                  alt={iconConfig.label}
                  className="dark:invert"
                  style={{
                    width: iconSize,
                    height: iconSize,
                    opacity: defaultOpacity,
                    transform: key === 'manifold' ? 'scale(1.33)' : undefined,
                    transformOrigin: 'center',
                    transition: 'all 200ms',
                  }}
                />
              )}
            </div>
            <span 
              className={`${uiConfig.socialLinks.labelTextSize} transition-colors font-medium`}
              style={{ color: getDefaultLabelColor() }}
            >
              {iconConfig.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
