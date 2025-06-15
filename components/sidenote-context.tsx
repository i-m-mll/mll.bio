"use client"

import { createContext, useContext, useRef, ReactNode } from 'react'

interface SidenoteContextValue {
  getNextNumber: () => number
  resetCounter: () => void
}

const SidenoteContext = createContext<SidenoteContextValue | null>(null)

export function SidenoteProvider({ children }: { children: ReactNode }) {
  const counterRef = useRef(0)

  const getNextNumber = () => {
    counterRef.current += 1
    return counterRef.current
  }

  const resetCounter = () => {
    counterRef.current = 0
  }

  return (
    <SidenoteContext.Provider value={{ getNextNumber, resetCounter }}>
      {children}
    </SidenoteContext.Provider>
  )
}

export function useSidenoteNumber() {
  const context = useContext(SidenoteContext)
  if (!context) {
    throw new Error('useSidenoteNumber must be used within a SidenoteProvider')
  }
  return context
} 