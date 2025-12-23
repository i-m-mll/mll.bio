'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface CommitInfo {
  sha: string
  shortSha: string
  date: string
  message: string
}

interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  lineNumber?: number
}

interface DiffToolbarProps {
  commits: CommitInfo[]
  currentSha?: string
  hasUncommittedChanges: boolean
  filePath: string
  diffLines?: DiffLine[]
}

/**
 * Find the element closest to the vertical center of the viewport
 */
function getElementAtViewportCenter(): { element: Element; offsetRatio: number } | null {
  const viewportCenter = window.innerHeight / 2
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, figure')

  let closestElement: Element | null = null
  let closestRect: DOMRect | null = null
  let closestDistance = Infinity

  elements.forEach(el => {
    const rect = el.getBoundingClientRect()
    // Only consider elements that are at least partially visible
    if (rect.bottom < 0 || rect.top > window.innerHeight) return

    const elementCenter = rect.top + rect.height / 2
    const distance = Math.abs(elementCenter - viewportCenter)

    if (distance < closestDistance) {
      closestDistance = distance
      closestElement = el
      closestRect = rect
    }
  })

  if (closestElement && closestRect) {
    // Calculate how far into the element the viewport center is (0-1 ratio)
    // Use non-null assertion since we check both above
    const rect = closestRect as DOMRect
    const offsetRatio = (viewportCenter - rect.top) / rect.height
    return { element: closestElement, offsetRatio: Math.max(0, Math.min(1, offsetRatio)) }
  }

  return null
}

/**
 * Scroll to restore an element to its previous viewport position
 */
function scrollToRestorePosition(element: Element, offsetRatio: number) {
  const rect = element.getBoundingClientRect()
  const viewportCenter = window.innerHeight / 2
  const targetElementCenter = rect.top + rect.height * offsetRatio
  const scrollAdjustment = targetElementCenter - viewportCenter

  window.scrollBy({ top: scrollAdjustment, behavior: 'instant' })
}

export function DiffToolbar({
  commits,
  currentSha,
  hasUncommittedChanges,
  filePath,
  diffLines = []
}: DiffToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [diffVisible, setDiffVisible] = useState(true)

  const diffEnabled = searchParams.get('diff') !== null
  const selectedSha = searchParams.get('diff') || (hasUncommittedChanges ? commits[0]?.sha : commits[1]?.sha)

  // Apply/remove diff-hidden class on body when visibility changes
  useEffect(() => {
    if (diffVisible) {
      document.body.classList.remove('diff-hidden')
    } else {
      document.body.classList.add('diff-hidden')
    }
    return () => {
      document.body.classList.remove('diff-hidden')
    }
  }, [diffVisible])

  // Toggle diff visibility with scroll position preservation
  const handleToggleDiffVisibility = useCallback(() => {
    // Capture current position
    const anchor = getElementAtViewportCenter()

    // Toggle visibility
    setDiffVisible(prev => !prev)

    // Restore scroll position after DOM updates
    if (anchor) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToRestorePosition(anchor.element, anchor.offsetRatio)
        })
      })
    }
  }, [])

  const handleToggleDiff = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (diffEnabled) {
      params.delete('diff')
      setShowPanel(false)
    } else {
      const defaultSha = hasUncommittedChanges ? commits[0]?.sha : commits[1]?.sha
      if (defaultSha) {
        params.set('diff', defaultSha)
      }
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleCommitChange = (sha: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('diff', sha)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Count changes
  const addedLines = diffLines.filter(l => l.type === 'add').length
  const removedLines = diffLines.filter(l => l.type === 'remove').length

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-4 right-4 z-50 bg-background border border-border rounded-lg p-2 shadow-lg hover:bg-accent transition-colors"
        title="Show diff toolbar"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v18M3 12h18" />
        </svg>
      </button>
    )
  }

  return (
    <>
      {/* Main toolbar */}
      <div className="fixed bottom-4 right-4 z-50 bg-background border border-border rounded-lg shadow-lg p-3 min-w-[280px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
          <span className="text-sm font-medium">Diff Viewer</span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Collapse"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Diff visibility toggle */}
        {diffEnabled && (
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <span className="text-xs text-muted-foreground">Show changes</span>
            <button
              onClick={handleToggleDiffVisibility}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                diffVisible ? 'bg-primary' : 'bg-muted'
              }`}
              title={diffVisible ? 'Hide diff markers' : 'Show diff markers'}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  diffVisible ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Status indicator */}
        {hasUncommittedChanges && (
          <div className="flex items-center gap-2 mb-3 text-xs text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Uncommitted changes
          </div>
        )}

        {/* Commit selector */}
        {commits.length > 0 && (
          <div className="space-y-2 mb-3">
            <label className="text-xs text-muted-foreground">Compare with:</label>
            <select
              value={selectedSha || ''}
              onChange={(e) => handleCommitChange(e.target.value)}
              className="w-full text-sm bg-muted border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {commits.map((commit, idx) => (
                <option key={commit.sha} value={commit.sha}>
                  {commit.shortSha} - {commit.date} - {commit.message}
                  {idx === 0 && hasUncommittedChanges && ' (HEAD)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* View diff button */}
        {diffEnabled && diffLines.length > 0 && (
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="w-full text-sm bg-primary text-primary-foreground rounded px-3 py-2 hover:bg-primary/90 transition-colors mb-3"
          >
            {showPanel ? 'Hide' : 'View'} Diff ({addedLines > 0 && `+${addedLines}`}{addedLines > 0 && removedLines > 0 && ' / '}{removedLines > 0 && `-${removedLines}`})
          </button>
        )}

        {/* Legend */}
        <div className="pt-2 border-t border-border flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-green-500/20 border border-green-500/40" />
            Added
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-red-500/20 border border-red-500/40" />
            Removed
          </span>
        </div>

        {/* File info */}
        <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground truncate" title={filePath}>
          {filePath}
        </div>
      </div>

      {/* Diff panel */}
      {showPanel && diffLines.length > 0 && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPanel(false)}>
          <div
            className="bg-background border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-medium">Changes</h3>
                <p className="text-sm text-muted-foreground">{filePath}</p>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="p-2 hover:bg-accent rounded transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Diff content */}
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm font-mono">
                {diffLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`px-2 py-0.5 ${
                      line.type === 'add'
                        ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                        : line.type === 'remove'
                        ? 'bg-red-500/15 text-red-700 dark:text-red-300 line-through'
                        : ''
                    }`}
                  >
                    <span className="inline-block w-6 text-muted-foreground text-right mr-4 select-none">
                      {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                    </span>
                    {line.content || ' '}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
