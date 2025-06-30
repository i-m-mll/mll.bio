// Server component to inline highlight.js themes without client JS
import { lightThemeCss, darkThemeCss } from '@/lib/active-code-themes'

// Helper replicates scoping logic from former CodeThemeLoader but at build time
function scopeCssToDarkMode(css: string): string {
  return css.replace(/(^|})([^{]+)({)/g, (m, p1, p2, p3) => {
    const selectors = p2.trim()
    if (selectors.startsWith('@')) return m
    const scoped = selectors
      .split(',')
      .map((s) => `.dark ${s.trim()}`)
      .join(', ')
    return `${p1}${scoped}${p3}`
  })
}

export function CodeThemeStyles() {
  const darkScoped = scopeCssToDarkMode(darkThemeCss)
  return (
    <>
      <style id="code-theme-light" dangerouslySetInnerHTML={{ __html: lightThemeCss }} />
      <style id="code-theme-dark" dangerouslySetInnerHTML={{ __html: darkScoped }} />
    </>
  )
}
