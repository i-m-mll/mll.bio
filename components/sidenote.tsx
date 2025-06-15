"use client"

import { useEffect, useRef, useState } from "react"
import { useSidenoteNumber } from "./sidenote-context"

interface SidenoteProps {
  id: string
  content: string
}

export function Sidenote({ id, content }: SidenoteProps) {
  const [sidenoteNumber, setSidenoteNumber] = useState<number>(0)
  const { getNextNumber } = useSidenoteNumber()
  const hasAssignedNumber = useRef(false)
  
  useEffect(() => {
    if (!hasAssignedNumber.current) {
      const number = getNextNumber()
      setSidenoteNumber(number)
      hasAssignedNumber.current = true
    }
  }, [getNextNumber])

  const mainTextId = `sidenote-ref-${id}`
  const sidenoteId = `sidenote-${id}`

  if (sidenoteNumber === 0) {
    return null // Don't render until we have a number
  }

  return (
    <span className="sidenote-wrapper">
      <label htmlFor={sidenoteId} className="margin-toggle">
        <sup className="sidenote-number" id={mainTextId}>
          {sidenoteNumber}
        </sup>
      </label>
      <input type="checkbox" id={sidenoteId} className="margin-toggle-input" />
      <span className="sidenote" id={`sidenote-content-${id}`}>
        <a href={`#${mainTextId}`} className="sidenote-counter">
          {sidenoteNumber}.
        </a>{" "}
        {content}
      </span>
    </span>
  )
} 