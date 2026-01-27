import Link from "next/link"
import { SubscribeForm } from "@/components/subscribe-form"
import { siteConfig } from "@/lib/config/site"

interface SubscribeBoxProps {
  /** Additional classes for the container (e.g., for centering) */
  className?: string
}

/**
 * Subscribe box component with email form and RSS link.
 * Shows RSS-only fallback when newsletter is not configured.
 */
export function SubscribeBox({ className = "" }: SubscribeBoxProps) {
  const hasNewsletter = !!siteConfig.newsletter.buttondownUsername
  const showBorder = siteConfig.homepage.subscribeBorder

  if (!hasNewsletter) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-sm text-muted-foreground">
          Subscribe via <Link href="/feed.xml" className="underline hover:text-foreground">RSS</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className={`px-5 py-4 rounded-md bg-stone-50/50 dark:bg-stone-900/50 ${showBorder ? 'border border-stone-200 dark:border-stone-700' : ''} ${className}`}>
      <div className="flex items-baseline justify-center gap-2 mb-3">
        <span className="text-lg font-semibold font-heading">Subscribe</span>
        <span className="text-sm text-muted-foreground">
          by <Link href="/feed.xml" className="underline hover:text-foreground">RSS</Link> or by email:
        </span>
      </div>
      <SubscribeForm buttondownUsername={siteConfig.newsletter.buttondownUsername} />
    </div>
  )
}
