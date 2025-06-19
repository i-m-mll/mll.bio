"use client"

import { useEffect } from 'react'
import { lightThemeCss, darkThemeCss } from '@/lib/active-code-themes'

/**
 * Prepends '.dark ' to each selector in a CSS string.
 * This function handles complex selectors, including those with commas.
 */
function scopeCssToDarkMode(css: string): string {
  // A simple regex to find all selectors, excluding @-rules.
  // This is not perfect but covers the vast majority of highlight.js themes.
  return css.replace(/(^|})([^{]+)({)/g, (match, p1, p2, p3) => {
    const selectors = p2.trim();
    if (selectors.startsWith('@')) {
      return match; // Don't scope @-rules like @font-face
    }
    const scopedSelectors = selectors
      .split(',')
      .map((s: string) => `.dark ${s.trim()}`)
      .join(', ');
    return `${p1}${scopedSelectors}${p3}`;
  });
}

export function CodeThemeLoader() {
  useEffect(() => {
    const scopedDarkThemeCss = scopeCssToDarkMode(darkThemeCss)

    const lightStyleId = 'code-theme-light';
    const darkStyleId = 'code-theme-dark';

    // Update or create the light theme style element
    let lightStyle = document.getElementById(lightStyleId) as HTMLStyleElement | null;
    if (!lightStyle) {
      lightStyle = document.createElement('style');
      lightStyle.id = lightStyleId;
      document.head.appendChild(lightStyle);
    }
    lightStyle.innerHTML = lightThemeCss;

    // Update or create the dark theme style element
    let darkStyle = document.getElementById(darkStyleId) as HTMLStyleElement | null;
    if (!darkStyle) {
      darkStyle = document.createElement('style');
      darkStyle.id = darkStyleId;
      document.head.appendChild(darkStyle);
    }
    darkStyle.innerHTML = scopedDarkThemeCss;

  }, [])

  return null
} 