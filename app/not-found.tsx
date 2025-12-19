import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container max-w-4xl py-10 flex flex-col items-center justify-center">
      <h2 className="text-3xl font-bold tracking-tight mb-4 font-heading">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
      >
        Return Home
      </Link>
    </div>
  )
}
