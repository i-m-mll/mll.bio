"use client"

import { useEffect } from 'react'
import { uiConfig } from '@/lib/ui-config'

export function UiConfigProvider() {
  useEffect(() => {
    // Inject ui-config values into CSS custom properties
    const root = document.documentElement
    
    // Typography settings
    root.style.setProperty('--global-font-scale', uiConfig.typography.globalFontScale.toString())
  }, [])

  return null // This component doesn't render anything
} 