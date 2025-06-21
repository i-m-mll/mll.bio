import fs from 'node:fs/promises'
import path from 'node:path'
import { DEV_GOOGLE_FONTS } from '../dev/google-fonts.js'

/**
 * Generates a mapping of Google Font family → { weights: string[], italics: boolean }
 * using the Google Web Fonts Developer API.
 *
 * Usage: `GOOGLE_FONTS_API_KEY=xxx node scripts/gen-font-variants.mjs`
 */

const API_KEY = process.env.GOOGLE_FONTS_API_KEY
if (!API_KEY) {
  console.error('❌  Missing GOOGLE_FONTS_API_KEY environment variable.')
  process.exit(1)
}

const API_ENDPOINT = `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}`

try {
  const res = await fetch(API_ENDPOINT)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const { items } = await res.json()

  const variants = Object.fromEntries(
    DEV_GOOGLE_FONTS.map((family) => {
      const meta = items.find((f) => f.family === family)
      if (!meta) {
        console.warn(`⚠️  Font "${family}" not found in Google Fonts – skipping.`)
        return [family, { weights: [], italics: false }]
      }

      const weights = [...new Set(
        meta.variants.map((v) => v.replace(/[^0-9]/g, '') || '400')
      )]

      const italics = meta.variants.some((v) => v.includes('italic'))
      return [family, { weights, italics }]
    }),
  )

  const outPath = path.resolve('dev', 'google-font-variants.json')
  await fs.writeFile(outPath, JSON.stringify(variants, null, 2))
  console.log(`✅  ${outPath} updated.`)
} catch (err) {
  console.error('❌  Unable to generate font variants:', err)
  process.exit(1)
} 