"use client"

import { useCallback, useEffect, useRef, useState, useLayoutEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { uiConfig } from "@/lib/config/ui"
import { renderInlineMarkdown } from "@/lib/utils"

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

// Simple debounce implementation (no external dep)
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export default function SearchBar() {
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

  // Load Lunr + index.json lazily
  const loadIndex = useCallback(async () => {
    if (indexLoaded) return
    try {
      const [{ default: lunrModule }, data] = await Promise.all([
        import("lunr"),
        fetch("/search/index.json").then((r) => r.json()),
      ])
      const lunr = (lunrModule as any).default ?? lunrModule
      lunrRef.current = lunr
      lunrIndexRef.current = lunr.Index.load(data.index)
      storeRef.current = data.store
      setIndexLoaded(true)
    } catch (err) {
      console.error("Failed to load search index", err)
    }
  }, [indexLoaded])

  // Handle searching when debouncedQuery changes
  useEffect(() => {
    if (!indexLoaded || debouncedQuery.trim() === "" || !lunrIndexRef.current) {
      setResults([])
      return
    }
    try {
      const terms = debouncedQuery.trim().split(/\s+/)
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
      const radius = 30
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

            const startLine = lineIndex // begin snippet at the matched line
            const endLine = Math.min(codeLines.length, startLine + uiConfig.search.snippetLinesCode)
            const snippetLines = codeLines.slice(startLine, endLine).filter(l => !l.trim().startsWith('```'))
            const langClass = doc.lang ? `language-${doc.lang}` : ''
            // Determine appropriate rounded corners
            const topRounded = startLine === 0
            const bottomRounded = endLine === codeLines.length
            let preClasses = 'border-x'
            if (topRounded) preClasses += ' rounded-t-md'
            if (bottomRounded) preClasses += ' rounded-b-md'
            if (startLine !== 0) preClasses += ' border-t-0'
            if (endLine !== codeLines.length) preClasses += ' border-b-0'

            snippetHtml = `<pre class="${preClasses}"><code class="${langClass}">${snippetLines.join('\n')}</code></pre>`

            lastEndLine = endLine - 1
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

      const processed = Object.values(processedMap)
      setResults(processed.slice(0, 20))
    } catch (err) {
      console.error(err)
      setResults([])
    }
  }, [debouncedQuery, indexLoaded])

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

  useLayoutEffect(() => {
    if (!hljsRef.current) {
      import('highlight.js').then((m) => { hljsRef.current = m.default })
    }
  }, [])

  useEffect(() => {
    if (!hljsRef.current || results.length === 0) return
    const hljs = hljsRef.current
    const tokens = debouncedQuery.split(/\s+/).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    const tokenRegex = tokens.length ? new RegExp(`(${tokens.join('|')})`, 'gi') : null
    document.querySelectorAll('.search-snippet pre code').forEach((el) => {
      const codeEl = el as HTMLElement
      if (codeEl.classList.contains('hljs')) return
      const hasLang = [...codeEl.classList].some(c=>c.startsWith('language-'))
      if (hasLang) {
        hljs.highlightElement(codeEl)
      } else {
        const result = hljs.highlightAuto(codeEl.textContent || '')
        codeEl.innerHTML = result.value
        codeEl.classList.add('hljs')
      }

      // re-apply token highlighting
      if (tokenRegex) {
        codeEl.innerHTML = codeEl.innerHTML.replace(tokenRegex, '<mark>$1</mark>')
      }
    })
  }, [results])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onFocus={loadIndex}
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
        className="h-8 w-40 rounded-md border border-input bg-muted/30 px-2 text-sm transition-all focus:w-56 focus:border-accent focus:bg-background focus:outline-none"
      />
      {results.length > 0 && (
        <ul className="absolute right-0 mt-1 max-h-72 overflow-y-auto rounded-md border border-input bg-background shadow-lg" style={{width: uiConfig.search.dropdownMaxWidthRem ? `${uiConfig.search.dropdownMaxWidthRem}rem` : 'auto', maxWidth: '90vw'}}>
          {results.map((r, idx) => (
            <li key={r.id} className={`border-b last:border-b-0 ${idx === selectedIndex ? 'bg-accent/30' : ''}`}>
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
                    return r.snippetHtml.replace(regex, '<mark>$1</mark>')
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