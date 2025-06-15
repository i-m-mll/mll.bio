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
} 