"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from "react"
import type { Series, SeriesPost } from "@/lib/series"

export interface SeriesHeaderData {
  series: Series
  prevPost: SeriesPost | null
  nextPost: SeriesPost | null
  currentIndex: number
}

interface SeriesHeaderContextValue {
  data: SeriesHeaderData | null
  setData: (data: SeriesHeaderData | null) => void
}

const SeriesHeaderContext = createContext<SeriesHeaderContextValue | null>(null)

export function SeriesHeaderProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<SeriesHeaderData | null>(null)

  const setData = useCallback((newData: SeriesHeaderData | null) => {
    setDataState(newData)
  }, [])

  return (
    <SeriesHeaderContext.Provider value={{ data, setData }}>
      {children}
    </SeriesHeaderContext.Provider>
  )
}

export function useSeriesHeader() {
  const context = useContext(SeriesHeaderContext)
  if (!context) {
    throw new Error("useSeriesHeader must be used within SeriesHeaderProvider")
  }
  return context
}
