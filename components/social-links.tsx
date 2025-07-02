"use client"

import { siteConfig } from "@/lib/config/site"
import { uiConfig } from "@/lib/config/ui"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

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
      src: "https://cdn.simpleicons.org/github/000000",
      label: "GitHub"
    },
    manifold: {
      label: "Manifold",
      src: "/manifold.svg"
    },
    X: {
      src: "https://cdn.simpleicons.org/x/000000",
      label: "X"
    },
    bluesky: {
      src: "https://cdn.simpleicons.org/bluesky/000000",
      label: "Bluesky"
    },
    mastodon: {
      src: "https://cdn.simpleicons.org/mastodon/000000",
      label: "Mastodon"
    },
    linkedin: {
      src: "/InBug-Black.png",
      label: "LinkedIn"
    },
    discord: {
      src: "https://cdn.simpleicons.org/discord/000000",
      label: "Discord"
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

  return (
    <div
      className="mx-auto w-full p-4 rounded-md bg-stone-75 dark:bg-stone-925 flex flex-wrap justify-center"
      style={{ gap: `${uiConfig.socialLinks.gapRem}rem`, maxWidth: 'var(--content-width)' }}
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
