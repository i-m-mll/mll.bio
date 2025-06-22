import { siteConfig } from "@/lib/config/site"
import Link from "next/link"

export function SocialLinks() {
  const socialIcons: Record<string, { src?: string, alt: string, svg?: JSX.Element }> = {
    github: {
      src: "https://cdn.simpleicons.org/github/000000",
      alt: "GitHub"
    },
    manifold: {
      alt: "Manifold Markets",
      svg: (
        <svg
          width="25"
          height="25"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          strokeWidth="1.2"
          stroke="#000000"
          className="opacity-70 hover:opacity-100"
          aria-hidden="true"
        >
          <path
            d="M5.24854 17.0952L18.7175 6.80301L14.3444 20M5.24854 17.0952L9.79649 18.5476M5.24854 17.0952L4.27398 6.52755M14.3444 20L9.79649 18.5476M14.3444 20L22 12.638L16.3935 13.8147M9.79649 18.5476L12.3953 15.0668M4.27398 6.52755L10.0714 13.389M4.27398 6.52755L2 9.0818L4.47389 8.85643M12.9451 11.1603L10.971 5L8.65369 11.6611"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    },
    twitter: {
      src: "https://cdn.simpleicons.org/x/000000",
      alt: "X (Twitter)"
    },
    bluesky: {
      src: "https://cdn.simpleicons.org/bluesky/000000",
      alt: "Bluesky"
    },
    mastodon: {
      src: "https://cdn.simpleicons.org/mastodon/000000",
      alt: "Mastodon"
    },
    linkedin: {
      src: "/InBug-Black.png",
      alt: "LinkedIn"
    },
    discord: {
      src: "https://cdn.simpleicons.org/discord/000000",
      alt: "Discord"
    },
    email: {
      alt: "Email",
      svg: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-70 hover:opacity-100"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      )
    }
  }

  return (
    <div className="flex items-center space-x-4">
      {Object.entries(siteConfig.social).map(([key, url]) => {
        if (!url) return null
        
        const iconConfig = socialIcons[key]
        if (!iconConfig) return null

        const isEmail = key === 'email'
        const href = isEmail ? `mailto:${url}` : url
        const needsTargetBlank = !isEmail

        return (
          <Link
            key={key}
            href={href}
            {...(needsTargetBlank && { target: "_blank", rel: "noopener noreferrer" })}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {iconConfig.svg ? (
              iconConfig.svg
            ) : (
              <img
                src={iconConfig.src}
                alt={iconConfig.alt}
                width="20"
                height="20"
                className="opacity-70 hover:opacity-100"
              />
            )}
            <span className="sr-only">{iconConfig.alt}</span>
          </Link>
        )
      })}
    </div>
  )
}
