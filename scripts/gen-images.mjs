#!/usr/bin/env node
// Generate responsive AVIF + WebP variants and manifest for images in /content
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { hashFiles, outputsExist, pathExists, readJson, writeJson } from './generation-cache.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const contentDir = path.join(projectRoot, 'content')
const publicDir = path.join(projectRoot, 'public', 'optimized')
const manifestPath = path.join(projectRoot, 'generated', 'image-manifest.json')
const cachePath = path.join(projectRoot, 'generated', '.cache', 'gen-images.json')
const widths = [320, 640, 960, 1280]

async function getAllImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (e) => {
      const res = path.resolve(dir, e.name)
      if (e.isDirectory()) return getAllImages(res)
      if (/\.(jpe?g|png|svg)$/i.test(e.name)) return res
      return []
    }),
  )
  return files.flat()
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true })
}

function getManifestOutputPaths(manifest) {
  const outputPaths = [manifestPath]

  for (const entry of Object.values(manifest)) {
    if (Array.isArray(entry)) {
      for (const variant of entry) {
        outputPaths.push(path.join(projectRoot, 'public', variant.webp))
        outputPaths.push(path.join(projectRoot, 'public', variant.avif))
      }
      continue
    }

    if (entry?.path) outputPaths.push(path.join(projectRoot, 'public', entry.path))
    if (entry?.variants) {
      for (const variant of entry.variants) {
        outputPaths.push(path.join(projectRoot, 'public', variant.webp))
        outputPaths.push(path.join(projectRoot, 'public', variant.avif))
      }
    }
  }

  return outputPaths
}

async function canSkip(images) {
  if (!(await pathExists(cachePath)) || !(await pathExists(manifestPath))) return false

  const [{ signature }, manifest] = await Promise.all([
    readJson(cachePath),
    readJson(manifestPath),
  ])
  const currentSignature = await hashFiles(images, `gen-images:${widths.join(',')}`)

  return signature === currentSignature && await outputsExist(getManifestOutputPaths(manifest))
}

async function contentHash(abs) {
  const bytes = await fs.readFile(abs)
  return crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 8)
}

async function build() {
  const images = (await getAllImages(contentDir)).sort()
  if (await canSkip(images)) {
    console.log(`Images unchanged; skipping generation for ${images.length} source images`)
    return
  }

  const svgs = images.filter((p) => /\.svg$/i.test(p))
  const rasters = images.filter((p) => /\.(jpe?g|png)$/i.test(p))
  const manifest = {}
  await ensureDir(publicDir)
  // Copy SVGs verbatim to public so they are served by Next static export
  for (const svgPath of svgs) {
    const rel = path.relative(projectRoot, svgPath).replace(/\\/g, '/')
    const dest = path.join(projectRoot, 'public', rel)
    await ensureDir(path.dirname(dest))
    let svgContent = await fs.readFile(svgPath, 'utf8')
    // Remove width and height attributes from the root <svg ...> tag to make it responsive
    svgContent = svgContent.replace(/<svg([^>]*)(\swidth="[^"]*")([^>]*)/i, '<svg$1$3')
    svgContent = svgContent.replace(/<svg([^>]*)(\sheight="[^"]*")([^>]*)/i, '<svg$1$3')
    await fs.writeFile(dest, svgContent, 'utf8')
    const viewBox = svgContent.match(/\bviewBox=["']([^"']+)["']/i)?.[1]
    const viewBoxParts = viewBox?.trim().split(/[\s,]+/).map(Number)
    const width = viewBoxParts?.length === 4 ? viewBoxParts[2] : undefined
    const height = viewBoxParts?.length === 4 ? viewBoxParts[3] : undefined
    manifest[`/${rel}`] = { path: `/${rel}`, width, height }
  }

  // Optimise raster images
  for (const abs of rasters) {
    const rel = path.relative(projectRoot, abs).replace(/\\/g, '/')
    const hash = await contentHash(abs)
    const outDir = path.join(publicDir, hash)
    await ensureDir(outDir)

    const sourceMetadata = await sharp(abs).metadata()
    const sourceWidth = sourceMetadata.width
    const sourceHeight = sourceMetadata.height
    manifest[`/${rel}`] = {
      width: sourceWidth,
      height: sourceHeight,
      variants: [],
    }
    for (const w of widths) {
      const img = sharp(abs)
      if (sourceWidth && sourceWidth < w) continue // skip larger than source

      const webpName = `${w}.webp`
      const avifName = `${w}.avif`
      await Promise.all([
        img.resize(w).webp({ quality: 82 }).toFile(path.join(outDir, webpName)),
        img.resize(w).avif({ quality: 50 }).toFile(path.join(outDir, avifName)),
      ])
      manifest[`/${rel}`].variants.push({
        w,
        webp: `/optimized/${hash}/${webpName}`,
        avif: `/optimized/${hash}/${avifName}`,
      })
    }
  }
  await ensureDir(path.dirname(manifestPath))
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  await writeJson(cachePath, {
    signature: await hashFiles(images, `gen-images:${widths.join(',')}`),
    sources: images.length,
  })
  console.log(`Generated image manifest with ${Object.keys(manifest).length} entries and copied ${svgs.length} SVGs`)
}

build().catch((e) => {
  console.error(e)
  process.exit(1)
})
