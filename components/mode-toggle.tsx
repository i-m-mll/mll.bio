"use client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { uiConfig } from "@/lib/config/ui"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = () => {
    if (uiConfig.theme.followSystemTheme) {
      // When followSystemTheme is enabled, cycle through: system -> light -> dark -> system
      if (theme === "system") {
        setTheme("light")
      } else if (theme === "light") {
        setTheme("dark")
      } else {
        setTheme("system")
      }
    } else {
      // When followSystemTheme is disabled, only toggle between light and dark
      setTheme(theme === "light" ? "dark" : "light")
    }
  }

  // Determine which icon to show
  const showSunIcon = mounted && theme === "light"
  const showMoonIcon = mounted && (theme === "dark" || (!uiConfig.theme.followSystemTheme && theme === "system"))
  const showSystemIcon = mounted && uiConfig.theme.followSystemTheme && theme === "system"

  return (
    <button
      className="theme-toggle-button inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground"
      onClick={handleThemeToggle}
      disabled={!mounted}
      title={
        !mounted 
          ? "Toggle theme"
          : uiConfig.theme.followSystemTheme 
            ? `Current theme: ${theme || 'system'} (cycles: system → light → dark)`
            : `Toggle theme (current: ${theme || 'light'})`
      }
    >
      <span className="sr-only">Toggle theme</span>
      <div className="relative">
        {/* Sun icon - shown for light theme */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`lucide lucide-sun transition-all ${
            showSunIcon ? "scale-100 opacity-100" : "scale-0 opacity-0"
          } ${!mounted ? "scale-100 opacity-50" : ""}`}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
        
        {/* Moon icon - shown for dark theme */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`lucide lucide-moon absolute inset-0 transition-all ${
            showMoonIcon ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>

        {/* System/Monitor icon - shown when system theme is active and followSystemTheme is enabled */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`lucide lucide-monitor absolute inset-0 transition-all ${
            showSystemIcon ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        >
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
        </svg>
      </div>
    </button>
  )
}
