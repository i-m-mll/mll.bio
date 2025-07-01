"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export default function SearchHighlighter() {
  const searchParams = useSearchParams()
  const term = decodeURIComponent(searchParams.get("q") || "").trim()
  const blockParam = searchParams.get("b")
  const blockIdx = blockParam ? parseInt(blockParam, 10) : undefined

  useEffect(() => {
    if (!term) return

    // Remove previous highlights
    document.querySelectorAll('mark[data-search-highlight]')?.forEach(el => el.replaceWith(...el.childNodes))

    let attempts = 0
    const maxAttempts = 20

    const runHighlight = () => {
      const articles = Array.from(document.querySelectorAll<HTMLDivElement>("article.prose"))
      if (articles.length === 0) {
        if (attempts++ < maxAttempts) setTimeout(runHighlight, 50)
        return
      }

      const highlightClass = "bg-yellow-300 dark:bg-yellow-600"

      const tokens = term.split(/\s+/).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      if (!tokens.length) return
      const regex = new RegExp(`(${tokens.join('|')})`, 'gi')

      let firstMarkElem: HTMLElement | null = null

      articles.forEach(article => {
        const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT)
        const ranges: Range[] = []
        while (walker.nextNode()) {
          const node = walker.currentNode as Text
          const matches = [...node.data.matchAll(regex)]
          matches.forEach((m) => {
            const range = document.createRange()
            range.setStart(node, m.index ?? 0)
            range.setEnd(node, (m.index ?? 0) + m[0].length)
            ranges.push(range)
          })
        }

        ranges.forEach((r) => {
          const mark = document.createElement("mark")
          mark.className = highlightClass
          mark.setAttribute('data-search-highlight','')
          r.surroundContents(mark)
          if (!firstMarkElem) firstMarkElem = mark
        })
      })

      let scrolled = false

      if (typeof blockIdx === 'number' && !Number.isNaN(blockIdx)) {
        const selector = [
          'p','pre','li','blockquote','h1','h2','h3','h4','h5','h6',
        ].map(t => `article.prose ${t}`).join(',')
        const blocks = Array.from(document.querySelectorAll<HTMLElement>(selector))
        if (blockIdx >= 0 && blockIdx < blocks.length) {
          const targetBlock = blocks[blockIdx]
          const markInBlock = targetBlock.querySelector<HTMLElement>('mark[data-search-highlight]')
          scrollToCenter(markInBlock ?? targetBlock)
          scrolled = true
        }
      }

      if (!scrolled && firstMarkElem) {
        scrollToCenter(firstMarkElem as HTMLElement)
      }

      // Re-highlight code blocks that now contain <mark>
      const codeToFix = Array.from(document.querySelectorAll<HTMLPreElement>('article.prose pre'))
        .map(pre => pre.querySelector('code'))
        .filter((code): code is HTMLElement => Boolean(code && code.querySelector('mark')))

      if (codeToFix.length > 0) {
        import('highlight.js').then((m) => {
          const hljs = (m as any).default ?? m
          codeToFix.forEach(codeEl => {
            hljs.highlightElement(codeEl)
          })
        })
      }
    }

    runHighlight()
  }, [term, blockIdx])

  function uiScrollOffset() {
    return 80 // fallback constant, could keep sync with uiConfig.navigation.anchorScrollPaddingPx
  }

  function scrollToCenter(elem: HTMLElement) {
    const rect = elem.getBoundingClientRect()
    const offset = uiScrollOffset()
    const target = rect.top + window.scrollY - (window.innerHeight / 2) + (rect.height / 2) - offset
    window.scrollTo({ top: target, behavior: 'smooth' })
  }

  return null
} 