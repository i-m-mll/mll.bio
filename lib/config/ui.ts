export const uiConfig = {
  // Header behavior
  header: {
    // Scroll sensitivity (pixels) - lower values = more sensitive to slow scrolling
    scrollThreshold: 2,
    // Animation duration for hide/show transitions
    transitionDuration: 300, // milliseconds
    themeToggleSizeRem: 2.25, // size of the theme toggle icon/button in rem
  },
  
  // Mobile Table of Contents
  mobileToc: {
    // Enable inline mobile TOC above main text
    enableInlineToc: true,
    // Enable floating TOC button on mobile
    enableFloatingButton: true,
    // Position of the floating button ('top-left' | 'top-right' | 'bottom-left' | 'bottom-right')
    buttonPosition: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  },
  
  // Typography settings
  typography: {
    // Global font scale multiplier (1 = normal, 1.1 = 10% larger, 0.9 = 10% smaller)
    globalFontScale: 1,
    // Font configuration
    fonts: {
      // Define available fonts. The key will be used in the UI, and the value
      // should match the CSS variable defined in `lib/fonts.ts`.
      sans: 'et-book',
      'sans-alt': 'var(--font-inter)',
      mono: 'var(--font-roboto-mono)',
      serif: 'var(--font-source-serif)',
    },
    // Default font to use
    defaultFont: 'sans' as 'sans' | 'sans-alt' | 'mono' | 'serif',
  },
  
  // Theme settings
  theme: {
    // Enable following system theme (allows cycling through system/light/dark)
    followSystemTheme: true,
    // Color mode ('auto' | 'light' | 'dark')
    defaultMode: 'auto',
    // Enable theme persistence (remember user preference)
    persistMode: true,
    // 'wrap': Text wraps within container, better for mobile
    // 'scroll': Horizontal scrollbar appears when needed, preserves formatting
    overflowBehavior: 'wrap' as 'wrap' | 'scroll',
    // Set theme names by filename (without .css extension)
    // from the styles/code-themes/ directory. Themes will be auto-downloaded.
    lightTheme: 'github',
    darkTheme: 'atom-one-dark',
  },
  
  // Code blocks configuration
  codeBlocks: {
    // Overflow behavior for code blocks ('wrap' | 'scroll')
    // 'wrap': Text wraps within container, better for mobile
    // 'scroll': Horizontal scrollbar appears when needed, preserves formatting
    overflowBehavior: 'scroll' as 'wrap' | 'scroll',
  },
  
  // Sidenotes configuration
  sidenotes: {
    // Minimum space between consecutive sidenotes in the margin
    minSpaceBetweenNotes: '0rem',
    
    // Maximum length for sidenote truncation (null to disable)
    maxNoteLength: 200 as number | null,
    
    // Text to show when content is truncated
    truncationSuffix: '...',
    
    // Text for expand/collapse buttons
    expandButtonText: 'more',
    collapseButtonText: 'less',
    
    // Highlighting when targeted by anchor links
    highlightStartOpacity: 0.25, // Opacity at start of highlight (0-1)
    highlightEndOpacity: 0.0,   // Opacity after fade completes (0-1)
    highlightBorderStartOpacity: 0.5,  //! Unused
    highlightBorderEndOpacity: 0.01,  //! Unused
    highlightFadeDuration: '1s', // How long the highlight takes to fade out
  },

  // Navigation / anchor scrolling
  navigation: {
    // Extra padding (in pixels) to keep between the viewport edge and a navigated-to element
    anchorScrollPaddingPx: 80,
  },

  // Social links configuration
  socialLinks: {
    // Icon size in rem (1.5 = 24px base size, 2.25 = 36px for 50% increase)
    iconSizeRem: 1.5,
    // Gap between social link cards in rem
    gapRem: 1.5,
    // Text size for labels
    labelTextSize: 'text-sm',
    // Icon opacity when not hovered (0.0 to 1.0)
    iconOpacityDefault: 0.6,
    // Icon opacity when hovered (0.0 to 1.0)
    iconOpacityHover: 0.95,
  },

  // Dev tools toggles
  devTools: {
    // Enable or disable the in-browser font switcher overlay (dev only)
    fontSwitcher: false,
  },

  // Search configuration
  search: {
    // Enable or disable the site-wide search feature
    enabled: true,
    // Maximum number of matched positions to keep per document (null = keep all)
    maxSnippetsPerResult: null as number | null,
    // Max lines to display for paragraph snippets in the dropdown
    snippetLinesParagraph: 4,
    // Max lines to include for code snippets in dropdown (generated at build)
    snippetLinesCode: 7,
    // Responsive dropdown width; values feed into CSS clamp(min, vwFraction, ideal)
    dropdownWidth: {
      idealRem: 40,
      minRem: 16,
      vwFraction: 0.7, // 70% of viewport width
    } as const,
  },

  // Future UI configurations can be added here
  // animations: {
  //   defaultDuration: 200,
  //   defaultEasing: 'ease-in-out',
  // },
  // 
  // breakpoints: {
  //   mobile: 768,
  //   tablet: 1024,
  // },
} as const

// Utility function to apply sidenote configuration to CSS custom properties
export function applySidenoteConfig() {
  if (typeof window !== 'undefined') {
    const root = document.documentElement
    const { sidenotes } = uiConfig
    
    // Set minimum spacing between sidenotes
    root.style.setProperty('--sidenote-min-space-between', sidenotes.minSpaceBetweenNotes)
    
    // Set highlighting configuration variables
    root.style.setProperty('--sidenote-highlight-start-opacity', sidenotes.highlightStartOpacity.toString())
    root.style.setProperty('--sidenote-highlight-end-opacity', sidenotes.highlightEndOpacity.toString())
    root.style.setProperty('--sidenote-highlight-border-start-opacity', sidenotes.highlightBorderStartOpacity.toString())
    root.style.setProperty('--sidenote-highlight-border-end-opacity', sidenotes.highlightBorderEndOpacity.toString())
    root.style.setProperty('--sidenote-highlight-fade-duration', sidenotes.highlightFadeDuration)
  }
}

// Utility function to apply code block configuration to CSS custom properties
export function applyCodeBlockConfig() {
  if (typeof window !== 'undefined') {
    const root = document.documentElement
    const { codeBlocks } = uiConfig
    
    // Set code block overflow behavior
    root.style.setProperty('--code-block-overflow', codeBlocks.overflowBehavior === 'wrap' ? 'wrap' : 'auto')
    root.style.setProperty('--code-block-white-space', codeBlocks.overflowBehavior === 'wrap' ? 'pre-wrap' : 'pre')
  }
}

// Utility function to apply header configuration to CSS custom properties
// Combined function to apply all UI configurations
export function applyUIConfig() {
  applySidenoteConfig()
  applyCodeBlockConfig()
  if (typeof window !== 'undefined') {
    const root = document.documentElement
    const { header } = uiConfig
    
    // Set header icon size
    if (header.themeToggleSizeRem !== undefined) {
      root.style.setProperty('--header-icon-size', `${header.themeToggleSizeRem}rem`)
    }
  }
}

// Apply configuration on module load and DOM ready
if (typeof window !== 'undefined') {
  // Apply immediately if document is already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyUIConfig)
  } else {
    applyUIConfig()
  }
} 