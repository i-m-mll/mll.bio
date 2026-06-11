import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { escapeHtml, sanitizeUrl } from "./html-sanitizer.mjs"

export { escapeHtml, sanitizeClassName, sanitizeHtml, sanitizeUrl } from "./html-sanitizer.mjs"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Simple inline markdown renderer for ToC headings and other short text snippets.
 * Handles common inline formatting without the overhead of full MDX compilation.
 */
export function renderInlineMarkdown(text: string): string {
  const escaped = escapeHtml(text)
  return escaped
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_ (but not if preceded/followed by alphanumeric to avoid conflicts)
    .replace(/(?<!\w)\*(.*?)\*(?!\w)/g, '<em>$1</em>')
    .replace(/(?<!\w)_(.*?)_(?!\w)/g, '<em>$1</em>')
    // Inline code: `text`
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    // Inline links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const safeHref = sanitizeUrl(href)
      if (!safeHref) return label
      return `<a href="${escapeHtml(safeHref)}" class="underline hover:opacity-80">${label}</a>`
    })
}

/**
 * Strips all inline markdown formatting from a string.
 * Used for generating clean titles for browser tabs, etc.
 */
export function stripMarkdown(text: string): string {
  return text
    // Remove bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove italic: *text* or _text_
    .replace(/(?<!\w)\*(.*?)\*(?!\w)/g, '$1')
    .replace(/(?<!\w)_(.*?)_(?!\w)/g, '$1')
    // Remove inline code: `text`
    .replace(/`(.*?)`/g, '$1')
    // Remove strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '$1')
}

/**
 * Specialized inline markdown renderer for abstracts.
 * The abstract itself is rendered in italic, so markdown *italic* becomes regular text (inverted).
 */
export function renderAbstractMarkdown(text: string): string {
  return escapeHtml(text)
    // Bold: **text** or __text__ - keep as bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text* - invert to regular text (remove italic)
    .replace(/(?<!\w)\*(.*?)\*(?!\w)/g, '<span style="font-style: normal;">$1</span>')
    .replace(/(?<!\w)_(.*?)_(?!\w)/g, '<span style="font-style: normal;">$1</span>')
    // Inline code: `text`
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
}
