"use client"

import { useEffect } from 'react'

export function SidenoteSelection() {
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const sidenote = target.closest('.sidenote') as HTMLElement
      
      if (sidenote) {
        console.log('Mouse down in sidenote, enabling selection')
        // Enable selection for this sidenote immediately
        sidenote.classList.add('selecting')
        
        // Also enable selection for the entire document temporarily
        // to ensure the selection can start
        document.body.style.userSelect = 'text'
        document.body.style.webkitUserSelect = 'text'
      } else {
        // Clear selection state from all sidenotes when clicking outside
        document.querySelectorAll('.sidenote.selecting').forEach(el => {
          el.classList.remove('selecting')
        })
        
        // Reset document selection
        document.body.style.userSelect = ''
        document.body.style.webkitUserSelect = ''
      }
    }

    const handleMouseUp = () => {
      // Small delay to allow selection to complete
      setTimeout(() => {
        const selection = window.getSelection()
        const selectedText = selection?.toString().trim() || ''
        
        console.log('Mouse up, selected text:', selectedText)
        
        if (selectedText === '') {
          // No text selected, can disable selection
          document.querySelectorAll('.sidenote.selecting').forEach(el => {
            el.classList.remove('selecting')
          })
          document.body.style.userSelect = ''
          document.body.style.webkitUserSelect = ''
        }
        // If there is selected text, keep the 'selecting' class
      }, 10)
    }

    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return null
} 