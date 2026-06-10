import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function collectFiles(rootDir, predicate) {
  if (!(await pathExists(rootDir))) return []

  const entries = await fs.readdir(rootDir, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) return collectFiles(fullPath, predicate)
    return predicate(fullPath, entry.name) ? [fullPath] : []
  }))

  return nested.flat().sort()
}

export async function hashFiles(files, extra = '') {
  const hash = crypto.createHash('sha256')
  hash.update(extra)

  for (const filePath of files) {
    const stat = await fs.stat(filePath)
    hash.update(filePath)
    hash.update(String(stat.size))
    hash.update(await fs.readFile(filePath))
  }

  return hash.digest('hex')
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

export async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

export async function outputsExist(outputPaths) {
  const checks = await Promise.all(outputPaths.map(pathExists))
  return checks.every(Boolean)
}
