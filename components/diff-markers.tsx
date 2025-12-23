import { ReactNode } from 'react'

interface DiffMarkerProps {
  children: ReactNode
}

/**
 * Marks content as added (new in current version)
 * Renders with configurable "added" styling
 */
export function DiffAdd({ children }: DiffMarkerProps) {
  return (
    <span className="diff-inline-add">
      {children}
    </span>
  )
}

/**
 * Marks content as deleted (removed from previous version)
 * Renders with configurable "deleted" styling (strikethrough)
 */
export function DiffDel({ children }: DiffMarkerProps) {
  return (
    <del className="diff-inline-del">
      {children}
    </del>
  )
}

/**
 * Block-level addition marker for entire paragraphs/sections
 */
export function DiffAddBlock({ children }: DiffMarkerProps) {
  return (
    <div className="diff-block-add">
      {children}
    </div>
  )
}

/**
 * Block-level deletion marker for entire paragraphs/sections
 */
export function DiffDelBlock({ children }: DiffMarkerProps) {
  return (
    <div className="diff-block-del">
      <del>{children}</del>
    </div>
  )
}
