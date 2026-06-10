import fs from "node:fs"
import path from "node:path"

export type RasterVariant = { w: number; webp: string; avif: string }
export type RasterEntry = { width?: number; height?: number; variants: RasterVariant[] }
export type SvgEntry = { path: string; width?: number; height?: number }
export type ManifestEntry = RasterVariant[] | RasterEntry | SvgEntry
export type ImageManifest = Record<string, ManifestEntry>

export function getImageManifest(): ImageManifest {
  const manifestPath = path.join(process.cwd(), "generated", "image-manifest.json")

  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ImageManifest
  } catch {
    return {}
  }
}
