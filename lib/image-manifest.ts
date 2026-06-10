import fs from "node:fs"
import path from "node:path"

export type RasterVariant = { w: number; webp: string; avif: string }
export type SvgEntry = { path: string }
export type ManifestEntry = RasterVariant[] | SvgEntry
export type ImageManifest = Record<string, ManifestEntry>

export function getImageManifest(): ImageManifest {
  const manifestPath = path.join(process.cwd(), "generated", "image-manifest.json")

  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ImageManifest
  } catch {
    return {}
  }
}
