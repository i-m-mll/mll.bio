export function inferDimensionsFromSrc(src: string): { width?: number; height?: number } {
  const match = src.match(/[_-](\d{2,5})x(\d{2,5})(?=\.[a-z0-9]+(?:$|\?))/i)
  if (!match) return {}

  const width = Number(match[1])
  const height = Number(match[2])
  if (!Number.isFinite(width) || !Number.isFinite(height)) return {}

  return { width, height }
}
