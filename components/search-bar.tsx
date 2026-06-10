"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { renderInlineMarkdown, cn } from "@/lib/utils"
import { uiConfig } from "@/lib/config/ui"

interface StoredDoc {
  title: string
  slug: string
  url?: string
  blocks: Array<{
    blockIdx: number
    snippetText: string
    isCode?: boolean
    lang?: string
  }>
}

interface DisplayResult {
  id: string
  title: string
  slug: string
  url: string
  snippetHtml: string
  isCode?: boolean
  blockIdx?: number
}

// Component props to allow reuse in overlay/mobile variant
interface SearchBarProps {
  variant?: "default" | "overlay"
  initialQuery?: string
  focusOnMount?: boolean
}

// Simple debounce implementation (no external dep)
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function snippetToHtml(block: StoredDoc["blocks"][number]): string {
  const snippet = escapeHtml(block.snippetText)
  if (block.isCode) {
    const languageClass = block.lang ? ` language-${block.lang}` : ""
    return `<pre class="border rounded-md overflow-hidden"><code class="hljs${languageClass}">${snippet}</code></pre>`
  }
  return `<p>${snippet}</p>`
}

function findBlocksForTerms(doc: StoredDoc, terms: string[], limit: number | null): StoredDoc["blocks"] {
  const escapedTerms = terms
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))

  if (escapedTerms.length === 0) {
    return doc.blocks.slice(0, limit ?? 1)
  }

  const regex = new RegExp(escapedTerms.join("|"), "i")
  const matches = doc.blocks.filter((block) => regex.test(block.snippetText))
  const blocks = matches.length > 0 ? matches : doc.blocks.slice(0, 1)

  if (limit === null || limit < 0) return blocks
  return blocks.slice(0, Math.max(1, limit))
}

// Safely wrap matched tokens in <mark> after snippet text has been escaped.
function highlightTokensInEscapedHtml(html: string, tokenRegex: RegExp, markClass: string): string {
  const segments = html.split(/(<[^>]+?>)/g)
  return segments.map((seg) => {
    if (seg.startsWith("<")) return seg
    return seg.replace(tokenRegex, `<mark class="${markClass}" data-search-highlight>$1</mark>`)
  }).join("")
}

export default function SearchBar({ variant = "default", initialQuery = "", focusOnMount = false }: SearchBarProps) {
  const searchId = useId()
  const [query, setQuery] = useState(initialQuery)
  const debouncedQuery = useDebouncedValue(query, 200)
  const [results, setResults] = useState<DisplayResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [indexLoaded, setIndexLoaded] = useState(false)
  const [indexError, setIndexError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const lunrIndexRef = useRef<any>(null)
  const lunrRef = useRef<any>(null)
  const storeRef = useRef<Record<string, StoredDoc>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const listRef = useRef<HTMLUListElement>(null)
  // Ref for the whole search component wrapper to detect outside clicks
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listboxId = `${searchId}-results`
  const statusId = `${searchId}-status`
  const activeOptionId = selectedIndex >= 0 ? `${searchId}-option-${selectedIndex}` : undefined

  // Load Lunr + index.json lazily
  const loadIndex = useCallback(async () => {
    if (indexLoaded) return
    setIndexError(null)
    try {
      const [{ default: lunrModule }, response] = await Promise.all([
        import("lunr"),
        fetch("/search/index.json"),
      ])

      if (!response.ok) {
        throw new Error(`Failed to fetch search index: ${response.status}`)
      }

      const data = await response.json()

      if (!data.index || !data.store) {
        throw new Error("Invalid search index format")
      }

      const lunr = (lunrModule as any).default ?? lunrModule
      lunrRef.current = lunr
      lunrIndexRef.current = lunr.Index.load(data.index)
      storeRef.current = data.store
      setIndexLoaded(true)
    } catch (err) {
      console.error("Failed to load search index", err)
      setIndexError(err instanceof Error ? err.message : "Failed to load search")
    }
  }, [indexLoaded])

  // Load index immediately on mount so it's ready when the user starts typing
  useEffect(() => {
    loadIndex()
  }, [loadIndex])

  // Focus the input on mount when requested (fires after component is ready,
  // regardless of dynamic import load time)
  useEffect(() => {
    if (focusOnMount) {
      inputRef.current?.focus()
    }
  }, [focusOnMount])

  // Helper to compute search results for a given trimmed query string
  const computeResults = useCallback((trimmed: string): DisplayResult[] => {
    if (!indexLoaded || trimmed.length < 2 || !lunrIndexRef.current) return []

    try {
      const terms = trimmed.split(/\s+/)
      const lunrIdx = lunrIndexRef.current
      const lunrLib = lunrRef.current

      const hits: any[] = lunrIdx.query((q: any) => {
        terms.forEach((termRaw: string) => {
          if (!termRaw) return
          const term = termRaw.toLowerCase()

          // Always add wildcard version for prefix tolerance
          q.term(term, {
            wildcard: lunrLib.Query.wildcard.TRAILING,
            presence: lunrLib.Query.presence.OPTIONAL,
          })

          // Add stemmed form without wildcard to catch fully-spelled words
          let stemmed = term
          try {
            if (typeof lunrLib.stemmer === 'function' && typeof lunrLib.Token === 'function') {
              const tok = new lunrLib.Token(term)
              stemmed = lunrLib.stemmer(tok).toString()
            }
          } catch (_) {}

          if (stemmed && stemmed !== term) {
            q.term(stemmed, {
              presence: lunrLib.Query.presence.OPTIONAL,
            })
          }
        })
      })

      const maxSnippets = uiConfig.search.maxSnippetsPerResult
      const processedMap: Record<string, DisplayResult> = {}

      hits.forEach((h: any) => {
        const doc = storeRef.current[h.ref as string]
        if (!doc) return

        const blocks = findBlocksForTerms(doc, terms, maxSnippets)
        blocks.forEach((block) => {
          const key = `${doc.url || doc.slug}-${block.blockIdx}`
          if (!processedMap[key]) {
            processedMap[key] = {
              id: key,
              title: doc.title,
              slug: doc.slug,
              url: doc.url || `/blog/${doc.slug}`,
              snippetHtml: snippetToHtml(block),
              isCode: block.isCode,
              blockIdx: block.blockIdx,
            }
          }
        })
      })

      const values = Object.values(processedMap)
      return (maxSnippets === null || maxSnippets < 0) ? values.slice(0, 20) : values.slice(0, 20)
    } catch (err) {
      console.error(err)
      return []
    }
  }, [indexLoaded])

  // Handle searching when debouncedQuery changes
  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (trimmed.length === 0) {
      setResults([])
      setIsSearching(false)
      return
    }
    if (trimmed.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const newResults = computeResults(trimmed)
    setResults(newResults)
    setSelectedIndex((current) => current >= newResults.length ? -1 : current)
    setIsSearching(false)
  }, [debouncedQuery, computeResults])

  const buildHref = (url: string, blockIdx?: number) => {
    const qStr = (query.trim() || debouncedQuery).trim()
    const params = new URLSearchParams()
    if (qStr) params.set('q', qStr)
    if (typeof blockIdx === 'number' && !Number.isNaN(blockIdx)) {
      params.set('b', String(blockIdx))
    }
    const queryStr = params.toString()
    return queryStr ? `${url}?${queryStr}` : url
  }

  // Ensure the selected result is visible inside the dropdown
  useEffect(() => {
    if (!listRef.current) return
    if (selectedIndex < 0) return
    const item = listRef.current.children[selectedIndex] as HTMLElement | undefined
    if (item) {
      item.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Close dropdown when clicking outside of the search component
  useEffect(() => {
    if (results.length === 0) return

    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) {
        setResults([])
        setSelectedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    document.addEventListener("touchstart", handleOutsideClick)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("touchstart", handleOutsideClick)
    }
  }, [results])

  return (
    <div ref={wrapperRef} className={cn("relative", variant === "overlay" ? "w-full" : undefined)}>
      <input
        ref={inputRef}
        type="search"
        value={query}
        role="combobox"
        aria-label="Search site"
        aria-autocomplete="list"
        aria-expanded={results.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-describedby={statusId}
        onFocus={(e) => {
          loadIndex()
          setSelectedIndex(-1)
          if (query.trim().length >= 2) {
            const trimmed = query.trim()
            const newResults = computeResults(trimmed)
            setResults(newResults)
          }
        }}
        onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1) }}
        onKeyDown={(e) => {
          if (results.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex((prev) => (prev + 1) % results.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
          } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && selectedIndex < results.length) {
              const sel = results[selectedIndex]
              router.push(buildHref(sel.url, sel.blockIdx), { scroll: false })
            }
          } else if (e.key === 'Escape') {
            setResults([])
            setSelectedIndex(-1)
          }
        }}
        placeholder="Search…"
        className={cn(
          variant === "overlay"
            ? "h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:border-accent focus:outline-none"
            : focusOnMount
              ? "h-8 w-56 rounded-md border border-input bg-background px-2 text-sm focus:border-accent focus:outline-none"
              : "h-8 w-40 rounded-md border border-input bg-muted/30 px-2 text-sm transition-all focus:w-56 focus:border-accent focus:bg-background focus:outline-none"
        )}
        autoFocus={variant === "overlay"}
      />
      <div id={statusId} role="status" aria-live="polite" className="sr-only">
        {indexError && debouncedQuery.trim().length >= 2
          ? indexError
          : !indexLoaded && debouncedQuery.trim().length >= 2
            ? "Loading search results."
            : results.length > 0
              ? `${results.length} search result${results.length === 1 ? "" : "s"} available.${
                  selectedIndex >= 0 ? ` ${results[selectedIndex]?.title ?? ""} selected.` : ""
                }`
              : debouncedQuery.trim().length >= 2 && !isSearching
                ? "No search results found."
                : ""}
      </div>
      {/* Error state */}
      {indexError && debouncedQuery.trim().length >= 2 && (
        <div className={cn(
          "mt-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-background",
          variant === "overlay"
            ? "border-t border-input"
            : "absolute right-0 rounded-md border border-input shadow-lg"
        )}
        style={variant !== "overlay" ? { width: 'max-content', maxWidth: 'calc(100vw - 1rem)' } : {}}
        >
          {indexError}
        </div>
      )}
      {/* Loading state - shown when index is still loading and user has typed */}
      {!indexLoaded && debouncedQuery.trim().length >= 2 && !indexError && (
        <div className={cn(
          "mt-2 px-3 py-2 text-sm text-muted-foreground bg-background",
          variant === "overlay"
            ? "border-t border-input"
            : "absolute right-0 rounded-md border border-input shadow-lg"
        )}
        style={variant !== "overlay" ? { width: 'max-content', maxWidth: 'calc(100vw - 1rem)' } : {}}
        >
          Loading…
        </div>
      )}
      {/* No results state */}
      {!indexError && indexLoaded && results.length === 0 && debouncedQuery.trim().length >= 2 && !isSearching && (
        <div className={cn(
          "mt-2 px-3 py-2 text-sm text-muted-foreground bg-background",
          variant === "overlay"
            ? "border-t border-input"
            : "absolute right-0 rounded-md border border-input shadow-lg"
        )}
        style={variant !== "overlay" ? { width: 'max-content', maxWidth: 'calc(100vw - 1rem)' } : {}}
        >
          No results found
        </div>
      )}
      {results.length > 0 && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className={cn(
            "mt-2 overflow-y-auto bg-background",
            variant === "overlay"
              ? "max-h-[60vh] w-full border-t border-input"
              : "absolute right-0 max-h-72 rounded-md border border-input shadow-lg"
          )}
          style={(() => {
            if (variant === "overlay") return {}
            const { dropdownWidth } = uiConfig.search
            const clampStr = `clamp(${dropdownWidth.minRem}rem, ${dropdownWidth.vwFraction * 100}vw, ${dropdownWidth.idealRem}rem)`
            return { width: clampStr, maxWidth: 'calc(100vw - 1rem)' }
          })()}
        >
          {results.map((r, idx) => (
            <li
              key={r.id}
              id={`${searchId}-option-${idx}`}
              role="option"
              aria-selected={idx === selectedIndex}
              className={`border-b last:border-b-0 ${idx === selectedIndex ? 'ring-inset ring-2 ring-stone-200 dark:ring-stone-700' : ''}`}
            >
              <Link href={buildHref(r.url, r.blockIdx)} scroll={false} className="block w-full px-3 py-2 text-left" onClick={() => {setQuery(""); setResults([]) }}>
                <div className="font-medium text-sm" dangerouslySetInnerHTML={{__html: renderInlineMarkdown(r.title)}} />
                {r.snippetHtml ? (
                  <div className="text-xs text-muted-foreground search-snippet" style={(() => {
                    if (r.isCode) {
                      return {maxHeight: `${uiConfig.search.snippetLinesCode * 1.4}em`, overflow: 'hidden'}
                    }
                    return {display:'-webkit-box', WebkitBoxOrient:'vertical', overflow:'hidden', WebkitLineClamp: uiConfig.search.snippetLinesParagraph}
                  })()} dangerouslySetInnerHTML={{__html: (() => {
                    const tokens = debouncedQuery.split(/\s+/).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                    if (!tokens.length) return r.snippetHtml
                    const regex = new RegExp(`(${tokens.join('|')})`, 'gi')
                    return highlightTokensInEscapedHtml(r.snippetHtml, regex, 'bg-yellow-300 dark:bg-yellow-600 text-inherit')
                  })() }} />
                ) : (
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {r.snippetHtml}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 
