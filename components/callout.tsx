import type React from "react"
import { cn } from "@/lib/utils"

type CalloutProps = {
  children: React.ReactNode
  type?: "info" | "warning" | "error" | "success"
  icon?: string
}

export function Callout({ children, type = "info", icon }: CalloutProps) {
  return (
    <div className={cn("callout", `callout-${type}`)}>
      <div className="flex items-start">
        {icon && <span className="mr-2">{icon}</span>}
        <div>{children}</div>
      </div>
    </div>
  )
}
