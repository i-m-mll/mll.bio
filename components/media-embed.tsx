interface SpotifyEmbedProps {
  src: string
  title?: string
}

interface YouTubeEmbedProps {
  src: string
  title?: string
}

export function SpotifyEmbed({ src, title = "Spotify embed" }: SpotifyEmbedProps) {
  return (
    <div className="my-6 overflow-hidden rounded-md border border-border bg-muted/20">
      <iframe
        title={title}
        src={src}
        className="block h-[152px] w-full"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    </div>
  )
}

export function YouTubeEmbed({ src, title = "YouTube embed" }: YouTubeEmbedProps) {
  return (
    <div className="my-6 overflow-hidden rounded-md border border-border bg-muted/20">
      <iframe
        title={title}
        src={src}
        className="aspect-video w-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}
