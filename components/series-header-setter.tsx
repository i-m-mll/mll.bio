"use client"

import { useEffect } from "react"
import { useSeriesHeader, SeriesHeaderData } from "@/lib/contexts/series-header"

// This component sets the series header data in context when mounted
// and clears it when unmounted (when navigating away from series page)
export function SeriesHeaderSetter({ data }: { data: SeriesHeaderData }) {
  const { setData } = useSeriesHeader()

  useEffect(() => {
    setData(data)
    return () => setData(null)
  }, [data, setData])

  return null
}
