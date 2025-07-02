"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { renderInlineMarkdown, cn } from "@/lib/utils"
import { uiConfig } from "@/lib/config/ui"

interface StoredDoc {
  title: string
  slug: string
  snippetHtml: string
  isCode?: boolean
  codeText?: string
  lang?: string
}

interface DisplayResult {
  id: string
  title: string
  slug: string
  snippetHtml: string
  blockIdx?: number
}

// Component props to allow reuse in overlay/mobile variant
interface SearchBarProps {
  variant?: "default" | "overlay"
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

// Safely wrap matched tokens in <mark> while ignoring HTML tags/attributes
function highlightTokensInHtml(html: string, tokenRegex: RegExp, markClass: string): string {
  const segments = html.split(/(<[^>]+?>)/g)
  return segments.map(seg => {
    if (seg.startsWith('<')) return seg
    return seg.replace(tokenRegex, `<mark class="${markClass}" data-search-highlight>$1</mark>`)
  }).join('')
}

export default function SearchBar({ variant = "default" }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query, 200)
  const [results, setResults] = useState<DisplayResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [indexLoaded, setIndexLoaded] = useState(false)
  const lunrIndexRef = useRef<any>(null)
  const lunrRef = useRef<any>(null)
  const storeRef = useRef<Record<string, StoredDoc>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const hljsRef = useRef<any>(null)
  const router = useRouter()
  const [hljsLoaded, setHljsLoaded] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  // Ref for the whole search component wrapper to detect outside clicks
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Load Lunr + index.json lazily
  const loadIndex = useCallback(async () => {
    if (indexLoaded) return
    try {
      const [{ default: lunrModule }, { default: hljsModule }, data] = await Promise.all([
        import("lunr"),
        import("highlight.js"),
        fetch("/search/index.json").then((r) => r.json()),
      ])
      const hljs = (hljsModule as any).default ?? hljsModule
      hljsRef.current = hljs
      setHljsLoaded(true)
      const lunr = (lunrModule as any).default ?? lunrModule
      lunrRef.current = lunr
      lunrIndexRef.current = lunr.Index.load(data.index)
      storeRef.current = data.store
      setIndexLoaded(true)
    } catch (err) {
      console.error("Failed to load search index", err)
    }
  }, [indexLoaded])

  // Helper to compute search results for a given trimmed query string
  const computeResults = useCallback((trimmed: string): DisplayResult[] => {
    if (!indexLoaded || !hljsLoaded || trimmed.length < 2 || !lunrIndexRef.current) return []

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
        const blockIdxFromRef = (() => {
          const parts = (h.ref as string).split("::")
          return parts.length === 2 ? parseInt(parts[1], 10) : undefined
        })()

        const positions: number[][] = []
        try {
          const metadata = h.matchData.metadata
          Object.values(metadata).forEach((fieldMeta: any) => {
            Object.values(fieldMeta).forEach((v: any) => {
              if (v.position) positions.push(...(v.position as any[]))
            })
          })
        } catch (_) {}

        positions.sort((a, b) => a[0] - b[0])
        const posToUse = (maxSnippets === null || maxSnippets < 0) ? positions : positions.slice(0, maxSnippets)

        if (posToUse.length === 0) {
          const key = doc.snippetHtml
          if (!processedMap[key]) {
            processedMap[key] = {
              id: `${doc.slug}-${blockIdxFromRef ?? 'x'}-desc`,
              title: doc.title,
              slug: doc.slug,
              snippetHtml: doc.snippetHtml,
              blockIdx: blockIdxFromRef,
            }
          }
          return
        }

        let lastEndLine = -1
        posToUse.forEach((p) => {
          let snippetHtml = doc.snippetHtml
          if (doc.isCode && doc.codeText) {
            const codeLines = doc.codeText.split('\n')
            let cumulative = 0
            let lineIndex = 0
            for (let i = 0; i < codeLines.length; i++) {
              const len = codeLines[i].length + 1 // newline
              if (cumulative + len > p[0]) { lineIndex = i; break }
              cumulative += len
            }
            if (lineIndex <= lastEndLine) return

            const visibleCount = uiConfig.search.snippetLinesCode
            const extraBefore = (lineIndex !== 0) ? 1 : 0 // top fade line
            const startLineSlice = Math.max(0, lineIndex - extraBefore)
            const atBottomBeforeCalc = (lineIndex + visibleCount >= codeLines.length)
            const extraAfter = atBottomBeforeCalc ? 0 : 1 // bottom fade line if truncated at bottom
            const endLineSlice = Math.min(codeLines.length, startLineSlice + visibleCount + extraBefore + extraAfter)

            const snippetLines = codeLines.slice(startLineSlice, endLineSlice).filter(l => !l.trim().startsWith('```'))

            const atTop = startLineSlice === 0
            const atBottom = endLineSlice === codeLines.length
            let preClasses = 'border-x relative overflow-hidden'
            if (atTop) {
              preClasses += ' border-t rounded-t-md'
            } else {
              preClasses += ' fade-top'
            }

            if (atBottom) {
              preClasses += ' border-b rounded-b-md'
            } else {
              preClasses += ' fade-bottom'
            }

            const codeSnippet = snippetLines.join('\n')
            let highlightedCode = codeSnippet
            if (hljsRef.current) {
              try {
                if (doc.lang && hljsRef.current.getLanguage(doc.lang)) {
                  highlightedCode = hljsRef.current.highlight(codeSnippet, { language: doc.lang }).value
                } else {
                  highlightedCode = hljsRef.current.highlightAuto(codeSnippet).value
                }
              } catch (_) {
                highlightedCode = hljsRef.current?.escapeHTML ? hljsRef.current.escapeHTML(codeSnippet) : codeSnippet
              }
            }

            snippetHtml = `<pre class="${preClasses}"><code class="hljs ${doc.lang ? `language-${doc.lang}` : ''}">${highlightedCode}</code></pre>`

            lastEndLine = endLineSlice - 1
          }
          const key = snippetHtml
          if (!processedMap[key]) {
            processedMap[key] = {
              id: `${doc.slug}-${blockIdxFromRef ?? 'x'}-${p[0]}`,
              title: doc.title,
              slug: doc.slug,
              snippetHtml,
              blockIdx: blockIdxFromRef,
            }
          }
        })
      })

      return Object.values(processedMap).slice(0, 20)
    } catch (err) {
      console.error(err)
      return []
    }
  }, [indexLoaded, hljsLoaded])

  // Handle searching when debouncedQuery changes
  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (trimmed.length === 0) {
      setResults([])
      return
    }
    setResults(computeResults(trimmed))
  }, [debouncedQuery, computeResults])

  const buildHref = (slug: string, blockIdx?: number) => {
    const qStr = (query.trim() || debouncedQuery).trim()
    const params = new URLSearchParams()
    if (qStr) params.set('q', qStr)
    if (typeof blockIdx === 'number' && !Number.isNaN(blockIdx)) {
      params.set('b', String(blockIdx))
    }
    const queryStr = params.toString()
    return queryStr ? `/blog/${slug}?${queryStr}` : `/blog/${slug}`
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
              router.push(buildHref(sel.slug, sel.blockIdx), { scroll: false })
            }
          }
        }}
        placeholder="Search…"
        className={cn(
          variant === "overlay"
            ? "h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:border-accent focus:outline-none"
            : "h-8 w-40 rounded-md border border-input bg-muted/30 px-2 text-sm transition-all focus:w-56 focus:border-accent focus:bg-background focus:outline-none"
        )}
        autoFocus={variant === "overlay"}
      />
      {results.length > 0 && (
        <ul
          ref={listRef}
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
            <li key={r.id} className={`border-b last:border-b-0 ${idx === selectedIndex ? 'ring-inset ring-2 ring-stone-200 dark:ring-stone-700' : ''}`}>
              <Link href={buildHref(r.slug, r.blockIdx)} scroll={false} className="block w-full px-3 py-2 text-left" onClick={() => {setQuery(""); setResults([]) }}>
                <div className="font-medium text-sm" dangerouslySetInnerHTML={{__html: renderInlineMarkdown(r.title)}} />
                {r.snippetHtml ? (
                  <div className="text-xs text-muted-foreground search-snippet" style={(() => {
                    const isCode = r.snippetHtml.startsWith('<pre')
                    if (isCode) {
                      return {maxHeight: `${uiConfig.search.snippetLinesCode * 1.4}em`, overflow: 'hidden'}
                    }
                    return {display:'-webkit-box', WebkitBoxOrient:'vertical', overflow:'hidden', WebkitLineClamp: uiConfig.search.snippetLinesParagraph}
                  })()} dangerouslySetInnerHTML={{__html: (() => {
                    const tokens = debouncedQuery.split(/\s+/).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                    if (!tokens.length) return r.snippetHtml
                    const regex = new RegExp(`(${tokens.join('|')})`, 'gi')
                    return highlightTokensInHtml(r.snippetHtml, regex, 'bg-yellow-300 dark:bg-yellow-600 text-inherit')
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