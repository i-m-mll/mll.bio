"use client"

import { useEffect } from 'react'
import { uiConfig, applyCodeBlockConfig } from '@/lib/config/ui'

export function UiConfigProvider() {
  useEffect(() => {
    // Inject ui-config values into CSS custom properties
    const root = document.documentElement
    
    // Typography settings
    root.style.setProperty('--global-font-scale', uiConfig.typography.globalFontScale.toString())
    
    // Apply code block configuration
    applyCodeBlockConfig()
  }, [])

  return null // This component doesn't render anything
} 