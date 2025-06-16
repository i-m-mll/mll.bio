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
    buttonPosition: 'bottom-right',
  },
  
  // Typography settings
  typography: {
    // Global font scale multiplier (1 = normal, 1.1 = 10% larger, 0.9 = 10% smaller)
    globalFontScale: 1,
  },
  
  // Theme settings
  theme: {
    // Color mode ('auto' | 'light' | 'dark')
    defaultMode: 'auto',
    // Enable theme persistence (remember user preference)
    persistMode: true,
  },
  
  // Sidenotes configuration
  sidenotes: {
    // Minimum space between consecutive notes in the margin
    // This controls how tightly packed sidenotes can be in the margins
    minSpaceBetweenNotes: '0.5rem',
    
    // Maximum length of a note before truncation kicks in
    // Set to null to disable truncation entirely
    maxNoteLength: 200, // characters
    
    // Text to append when a note is truncated
    truncationSuffix: '…',
    
    // Button text for expanding truncated notes
    expandButtonText: 'more',
    
    // Button text for collapsing expanded notes
    collapseButtonText: 'less',
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
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    root.style.setProperty('--sidenote-min-space-between', uiConfig.sidenotes.minSpaceBetweenNotes)
    
    // Debug: log the value being set
    console.log('Setting --sidenote-min-space-between to:', uiConfig.sidenotes.minSpaceBetweenNotes)
  }
}

// Apply configuration on module load and DOM ready
if (typeof window !== 'undefined') {
  // Apply immediately if document is already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySidenoteConfig)
  } else {
    applySidenoteConfig()
  }
} 