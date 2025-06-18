export const uiConfig = {
  // Header behavior
  header: {
    // Scroll sensitivity (pixels) - lower values = more sensitive to slow scrolling
    scrollThreshold: 2,
    // Animation duration for hide/show transitions
    transitionDuration: 300, // milliseconds
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
  },
  
  // Theme settings
  theme: {
    // Enable following system theme (allows cycling through system/light/dark)
    followSystemTheme: true,
    // Color mode ('auto' | 'light' | 'dark')
    defaultMode: 'auto',
    // Enable theme persistence (remember user preference)
    persistMode: true,
  },
  
  // Code blocks configuration
  codeBlocks: {
    // Overflow behavior for code blocks ('wrap' | 'scroll')
    // 'wrap': Text wraps within container, better for mobile
    // 'scroll': Horizontal scrollbar appears when needed, preserves formatting
    //! TODO: Fix 'scroll'
    overflowBehavior: 'wrap' as 'wrap' | 'scroll',
  },
  
  // Sidenotes configuration
  sidenotes: {
    // Minimum space between consecutive sidenotes in the margin
    minSpaceBetweenNotes: '0rem',
    
    // Maximum length for sidenote truncation (null to disable)
    maxNoteLength: null as number | null,
    
    // Text to show when content is truncated
    truncationSuffix: '...',
    
    // Text for expand/collapse buttons
    expandButtonText: 'more',
    collapseButtonText: 'less',
    
    // Highlighting when targeted by anchor links
    highlightStartOpacity: 0.2, // Opacity at start of highlight (0-1)
    highlightEndOpacity: 0.0,   // Opacity after fade completes (0-1)
    highlightBorderStartOpacity: 0.5,
    highlightBorderEndOpacity: 0.01,
    highlightFadeDuration: '1.5s', // How long the highlight takes to fade out
  },

  // Navigation / anchor scrolling
  navigation: {
    // Extra padding (in pixels) to keep between the viewport edge and a navigated-to element
    anchorScrollPaddingPx: 80,
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
    
    console.log('Applied sidenote config:', {
      minSpaceBetween: sidenotes.minSpaceBetweenNotes,
      highlightStartOpacity: sidenotes.highlightStartOpacity,
      highlightEndOpacity: sidenotes.highlightEndOpacity,
      highlightFadeDuration: sidenotes.highlightFadeDuration
    })
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
    
    console.log('Applied code block config:', {
      overflowBehavior: codeBlocks.overflowBehavior,
    })
  }
}

// Combined function to apply all UI configurations
export function applyUIConfig() {
  applySidenoteConfig()
  applyCodeBlockConfig()
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