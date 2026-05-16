import { execFileSync } from 'child_process'
import * as Diff from 'diff'
import fs from 'fs'
import * as path from 'path'

export interface CommitInfo {
  sha: string
  shortSha: string
  date: string
  message: string
}

/**
 * Get the git root directory for a file (handles submodules)
 */
function getGitRoot(filePath: string): string {
  const fullPath = path.join(process.cwd(), filePath)
  const dir = path.dirname(fullPath)
  try {
    // Get the git root for the file's directory
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf-8',
      cwd: dir
    }).trim()
  } catch {
    return process.cwd()
  }
}

/**
 * Get the relative path within the git repo
 */
function getRelativePath(filePath: string, gitRoot: string): string {
  const fullPath = path.join(process.cwd(), filePath)
  return path.relative(gitRoot, fullPath)
}

/**
 * Get list of commits that modified a specific file
 */
export function getCommitList(filePath: string, limit = 10): CommitInfo[] {
  try {
    const gitRoot = getGitRoot(filePath)
    const relativePath = getRelativePath(filePath, gitRoot)
    const output = execFileSync(
      'git',
      [
        'log',
        '--pretty=format:%H|%h|%ad|%s',
        '--date=short',
        '-n',
        String(normalizeLimit(limit)),
        '--',
        relativePath,
      ],
      { encoding: 'utf-8', cwd: gitRoot }
    )

    if (!output.trim()) return []

    return output.trim().split('\n').map(line => {
      const [sha, shortSha, date, ...messageParts] = line.split('|')
      return {
        sha,
        shortSha,
        date,
        message: messageParts.join('|').slice(0, 50) // Truncate long messages
      }
    })
  } catch {
    return []
  }
}

/**
 * Get file content at a specific commit
 */
export function getVersionAtCommit(filePath: string, commitSha: string): string | null {
  if (!isCommitSha(commitSha)) return null

  try {
    const gitRoot = getGitRoot(filePath)
    const relativePath = getRelativePath(filePath, gitRoot)
    return execFileSync(
      'git',
      ['show', `${commitSha}:${relativePath}`],
      { encoding: 'utf-8', cwd: gitRoot }
    )
  } catch {
    return null
  }
}

/**
 * Get the current working copy of a file (including uncommitted changes)
 */
export function getCurrentVersion(filePath: string): string | null {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    return fs.readFileSync(fullPath, 'utf-8')
  } catch {
    return null
  }
}

/**
 * Check if a file has uncommitted changes
 */
export function hasUncommittedChanges(filePath: string): boolean {
  try {
    const gitRoot = getGitRoot(filePath)
    const relativePath = getRelativePath(filePath, gitRoot)
    const status = execFileSync(
      'git',
      ['status', '--porcelain', '--', relativePath],
      { encoding: 'utf-8', cwd: gitRoot }
    )
    return status.trim().length > 0
  } catch {
    return false
  }
}

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 10
  return Math.max(1, Math.min(Math.floor(limit), 100))
}

function isCommitSha(value: string): boolean {
  return /^[0-9a-f]{7,40}$/i.test(value)
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  lineNumber?: number
}

/**
 * Compute line-level diff and return structured diff data.
 * Does NOT inject markers into content - returns data for separate display.
 */
export function computeDiffLines(oldContent: string, newContent: string): DiffLine[] {
  // Strip frontmatter for comparison
  const oldBody = oldContent.replace(/^---\n[\s\S]*?\n---\n/, '')
  const newBody = newContent.replace(/^---\n[\s\S]*?\n---\n/, '')

  // Compute line-level diff
  const diff = Diff.diffLines(oldBody, newBody)

  const result: DiffLine[] = []
  let lineNum = 1

  for (const part of diff) {
    const lines = part.value.split('\n')
    // Remove trailing empty string from split if it ends with newline
    if (lines[lines.length - 1] === '') {
      lines.pop()
    }

    for (const line of lines) {
      if (part.added) {
        result.push({ type: 'add', content: line, lineNumber: lineNum++ })
      } else if (part.removed) {
        result.push({ type: 'remove', content: line })
      } else {
        result.push({ type: 'context', content: line, lineNumber: lineNum++ })
      }
    }
  }

  return result
}

/**
 * Escape special characters for JSX embedding
 */
function escapeForJsx(text: string): string {
  // Don't escape markdown/JSX syntax, just ensure braces are handled
  return text
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
}

/**
 * Get diff data for a post file
 */
export function getDiffData(filePath: string, compareToSha?: string) {
  const commits = getCommitList(filePath)
  const hasChanges = hasUncommittedChanges(filePath)

  // Default to comparing with HEAD if file has uncommitted changes,
  // otherwise compare with previous commit
  let comparisonSha = compareToSha
  if (!comparisonSha && commits.length > 0) {
    comparisonSha = hasChanges ? commits[0].sha : (commits[1]?.sha || commits[0].sha)
  }

  const oldContent = comparisonSha ? getVersionAtCommit(filePath, comparisonSha) : null
  const currentContent = getCurrentVersion(filePath)

  // Compute diff lines if we have both versions
  let diffLines: DiffLine[] = []
  if (oldContent && currentContent) {
    diffLines = computeDiffLines(oldContent, currentContent)
  }

  return {
    commits,
    hasUncommittedChanges: hasChanges,
    comparisonSha,
    oldContent,
    currentContent,
    diffLines,
    canDiff: oldContent !== null && currentContent !== null
  }
}
