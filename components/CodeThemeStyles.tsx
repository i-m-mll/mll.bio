// Server component to inline highlight.js themes without client JS
import { getCodeThemeData } from '@/lib/code-theme-data'

// Helper replicates scoping logic from former CodeThemeLoader but at build time
function scopeCssToDarkMode(css: string): string {
  return css.replace(/(^|})([^{]+)({)/g, (m, p1, p2, p3) => {
    const selectors = p2.trim()
    if (selectors.startsWith('@')) return m
    const scoped = selectors
      .split(',')
      .map((s: string) => `.dark ${s.trim()}`)
      .join(', ')
    return `${p1}${scoped}${p3}`
  })
}

export function CodeThemeStyles() {
  const { lightThemeCss, darkThemeCss } = getCodeThemeData()
  const darkScoped = scopeCssToDarkMode(darkThemeCss)
  // Provide a fallback for environments without JS: rely on prefers-color-scheme
  const darkMedia = `@media (prefers-color-scheme: dark){${darkThemeCss}}`
  return (
    <>
      <style id="code-theme-light" dangerouslySetInnerHTML={{ __html: lightThemeCss }} />
      <style id="code-theme-dark" dangerouslySetInnerHTML={{ __html: darkScoped }} />
      {/* Fallback for no-JS: system dark preference */}
      <style id="code-theme-dark-media" dangerouslySetInnerHTML={{ __html: darkMedia }} />
    </>
  )
}
