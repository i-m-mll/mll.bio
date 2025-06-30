interface TocHeaderProps {
  isCollapsed: boolean
  onToggle: () => void
  onClose?: () => void
  showCloseButton?: boolean
}

export function TocHeader({ isCollapsed, onToggle, onClose, showCloseButton = false }: TocHeaderProps) {
  if (showCloseButton) {
    // Mobile floating version with close button
    return (
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold font-heading">Contents</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
    )
  }

  // Standard collapsible version
  return (
    <button 
      onClick={onToggle}
      className="flex items-center gap-3 w-full py-2 border-none bg-transparent cursor-pointer text-sm text-foreground border-b border-border mb-1 hover:text-primary"
    >
      <span className={`toc-toggle-icon transform transition-transform text-xs ${isCollapsed ? '' : 'rotate-90'}`}>
        ▸
      </span>
      <span className="font-semibold text-foreground font-heading">Contents</span>
    </button>
  )
} 