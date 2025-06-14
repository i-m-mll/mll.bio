"use client"

import { useEffect, useRef } from "react"

interface SidenoteProps {
  id: string
  content: string
}

// Use a global counter that persists across hot reloads
declare global {
  var __sidenoteCounter: number | undefined
}

if (typeof globalThis.__sidenoteCounter === 'undefined') {
  globalThis.__sidenoteCounter = 0
}

export function Sidenote({ id, content }: SidenoteProps) {
  const numberRef = useRef<number>(0)
  
  useEffect(() => {
    if (numberRef.current === 0) {
      globalThis.__sidenoteCounter = (globalThis.__sidenoteCounter || 0) + 1
      numberRef.current = globalThis.__sidenoteCounter
    }
  }, [])

  const mainTextId = `sidenote-ref-${id}`
  const sidenoteId = `sidenote-${id}`

  return (
    <span className="sidenote-wrapper">
      <label htmlFor={sidenoteId} className="margin-toggle">
        <sup className="sidenote-number" id={mainTextId}>
          {numberRef.current}
        </sup>
      </label>
      <input type="checkbox" id={sidenoteId} className="margin-toggle-input" />
      <span className="sidenote" id={`sidenote-content-${id}`}>
        <a href={`#${mainTextId}`} className="sidenote-counter">
          {numberRef.current}.
        </a>{" "}
        {content}
      </span>
    </span>
  )
} 