'use client'

import { useState, useEffect, useMemo } from 'react'
import variants from '@/dev/google-font-variants.json'
import { DEV_GOOGLE_FONTS } from '@/dev/google-fonts.js'

interface FontMeta {
  weights: string[]
  italics: boolean
}

const LS_KEY = 'dev-font-favorites'
const DEFAULT_FONT = 'et-book'

// Ensure JSON typing
const FONT_META: Record<string, FontMeta> = {
  [DEFAULT_FONT]: { weights: ['400', '600', '700'], italics: true },
  ...(variants as Record<string, FontMeta>),
}

function loadFont(family: string, weight: string, italic: boolean) {
  const italFlag = italic ? '1' : '0'
  if (family !== DEFAULT_FONT) {
    const href =
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:` +
      `ital,wght@${italFlag},${weight}&display=swap`

    let link = document.querySelector<HTMLLinkElement>('link[data-dev-font]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'stylesheet'
      link.dataset.devFont = 'true'
      document.head.appendChild(link)
    }
    link.href = href
  }
  document.documentElement.style.setProperty('--dev-title-font', `'${family}', serif`)
}

export default function DevFontSwitcher() {
  if (process.env.NODE_ENV === 'production') return null

  const [family, setFamily] = useState<string>(DEFAULT_FONT)
  const [weight, setWeight] = useState('400')
  const [italic, setItalic] = useState(false)
  const [size, setSize] = useState<number | null>(null) // rem title size
  const [favorites, setFavorites] = useState<string[]>([])

  // Load favorites from localStorage after mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) {
        setFavorites(JSON.parse(stored))
      }
    } catch {}
  }, [])

  // Update localStorage when favorites change (skip first empty mount)
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(LS_KEY, JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = () => {
    setFavorites((prev) => {
      const next = prev.includes(family)
        ? prev.filter((f) => f !== family)
        : [...prev, family]
      if (typeof window !== 'undefined') {
        localStorage.setItem(LS_KEY, JSON.stringify(next))
      }
      return next
    })
  }

  // Build sorted list with favorites first
  const sortedFonts = useMemo(() => {
    const favSet = new Set(favorites)
    const all = [...DEV_GOOGLE_FONTS, DEFAULT_FONT]
    const alph = [...new Set(all)].sort((a, b) => a.localeCompare(b))
    const favs = alph.filter((n) => favSet.has(n))
    const rest = alph.filter((n) => !favSet.has(n))
    return [...favs, ...rest]
  }, [favorites])

  // Initialize size from current computed font-size of the title element (Tailwind default)
  useEffect(() => {
    if (size === null && typeof window !== 'undefined') {
      const titleEl = document.querySelector('.text-title') as HTMLElement | null
      const rootFontSizePx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      if (titleEl) {
        const titlePx = parseFloat(getComputedStyle(titleEl).fontSize)
        const rem = +(titlePx / rootFontSizePx).toFixed(2)
        setSize(rem)
        // ensure CSS variable matches default at startup
        document.documentElement.style.setProperty('--dev-title-font-size', `${rem}rem`)
      } else {
        // fallback to 1 rem if not found
        setSize(1)
      }
    }
  }, [size])

  useEffect(() => {
    if (size === null) return
    loadFont(family, weight, italic)
    document.documentElement.style.setProperty('--dev-title-font-size', `${size}rem`)
  }, [family, weight, italic, size])

  const meta = FONT_META[family as string]
  const weights = meta?.weights?.length ? meta.weights : ['400']
  const italics = meta?.italics ?? false

  return (
    <aside
      className="fixed right-4 bottom-4 z-[99999] bg-white/90 dark:bg-background/90 shadow-xl rounded p-4 text-sm space-y-3 border border-gray-300 dark:border-border"
    >
      <div>
        <label className="block mb-1 font-medium">Font family</label>
        <select
          value={family}
          onChange={(e) => {
            setFamily(e.target.value)
            setWeight('400')
            setItalic(false)
          }}
          className="border px-2 py-1 w-56 rounded"
        >
          {sortedFonts.map((f: string) => {
            const isFav = favorites.includes(f)
            return (
              <option key={f} value={f}>
                {isFav ? '★ ' : ''}{f}
              </option>
            )
          })}
        </select>
        <button
          type="button"
          onClick={toggleFavorite}
          title={favorites.includes(family) ? 'Unfavorite' : 'Favorite'}
          className="ml-2 text-yellow-500 hover:text-yellow-600"
        >
          {favorites.includes(family) ? '★' : '☆'}
        </button>
      </div>

      <div>
        <label className="block mb-1 font-medium">Weight</label>
        <select
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="border px-2 py-1 w-28 rounded"
        >
          {weights.map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
      </div>

      {italics && (
        <div className="flex items-center space-x-2">
          <input
            id="dev-italic"
            type="checkbox"
            checked={italic}
            onChange={(e) => setItalic(e.target.checked)}
          />
          <label htmlFor="dev-italic">Italic</label>
        </div>
      )}

      <div>
        <label className="block mb-1 font-medium">Size (rem)</label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0.5"
            max="6"
            step="0.05"
            value={size ?? 1}
            onChange={(e) => setSize(parseFloat(e.target.value))}
            className="w-32"
          />
          <input
            type="number"
            step="0.05"
            value={size ?? ''}
            onChange={(e) => setSize(parseFloat(e.target.value) || 1)}
            className="border px-1 py-0 w-16 rounded text-right"
          />
        </div>
      </div>
    </aside>
  )
} 