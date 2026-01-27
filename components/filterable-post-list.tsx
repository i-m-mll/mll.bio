"use client"

import { useState } from "react"
import { PostList } from "@/components/post-list"
import type { Post } from "@/lib/blog"

// Extended post type that may include series info (matches PostList's expected type)
type ExtendedPost = Post & {
  frontmatter: Post["frontmatter"] & {
    series?: string
    seriesSlug?: string
  }
}

interface FilterablePostListProps {
  posts: ExtendedPost[]
  seriesPosts: ExtendedPost[]
  showSeriesByDefault: boolean
  title?: string
}

export function FilterablePostList({
  posts,
  seriesPosts,
  showSeriesByDefault,
  title = "All Posts"
}: FilterablePostListProps) {
  const [showSeries, setShowSeries] = useState(showSeriesByDefault)

  const displayedPosts = showSeries
    ? [...posts, ...seriesPosts].sort((a, b) => {
        const dateA = new Date(a.frontmatter.publishedRaw || "").getTime() || 0
        const dateB = new Date(b.frontmatter.publishedRaw || "").getTime() || 0
        return dateB - dateA
      })
    : posts

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {seriesPosts.length > 0 && (
          <button
            onClick={() => setShowSeries(!showSeries)}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span
              className={`
                inline-flex items-center justify-center w-4 h-4 rounded border transition-colors
                ${showSeries
                  ? 'bg-foreground border-foreground text-background'
                  : 'border-muted-foreground/50 group-hover:border-foreground/50'
                }
              `}
            >
              <svg
                className={`w-3 h-3 transition-opacity ${showSeries ? 'opacity-100' : 'opacity-0'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span>Include series posts</span>
          </button>
        )}
      </div>

      {displayedPosts.length > 0 ? (
        <PostList posts={displayedPosts} />
      ) : (
        <p className="text-muted-foreground">No posts published yet.</p>
      )}
    </div>
  )
}
