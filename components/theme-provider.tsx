"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"
import { uiConfig } from "@/lib/ui-config"

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Use system theme if followSystemTheme is enabled, otherwise default to light
  const defaultTheme = uiConfig.theme.followSystemTheme ? "system" : "light"
  const enableSystem = uiConfig.theme.followSystemTheme
  
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme={defaultTheme} 
      enableSystem={enableSystem} 
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
