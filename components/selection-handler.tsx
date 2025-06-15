"use client"

import { useEffect } from 'react'

export function SelectionHandler() {
  useEffect(() => {
    let isSelectingInSidenote = false

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      isSelectingInSidenote = target.closest('.sidenote') !== null
    }

    const handleSelectionChange = () => {
      // Skip if user is selecting within a sidenote
      if (isSelectingInSidenote) {
        return
      }

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        return
      }

      const range = selection.getRangeAt(0)
      
      // Check if the selection contains any sidenote elements
      const commonAncestor = range.commonAncestorContainer
      const containerElement = commonAncestor.nodeType === Node.TEXT_NODE 
        ? commonAncestor.parentElement 
        : commonAncestor as HTMLElement

      if (containerElement && containerElement.querySelector && containerElement.querySelector('.sidenote')) {
        // Selection contains sidenotes, we need to clean it up
        try {
          // Get all text nodes in the selection, excluding those in sidenotes
          const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                // Reject text nodes that are inside sidenotes
                const parent = node.parentElement
                if (parent && parent.closest('.sidenote')) {
                  return NodeFilter.FILTER_REJECT
                }
                
                // Accept text nodes that are within the selection range
                if (range.intersectsNode(node)) {
                  return NodeFilter.FILTER_ACCEPT
                }
                
                return NodeFilter.FILTER_REJECT
              }
            }
          )

          const textNodes: Node[] = []
          let node
          while (node = walker.nextNode()) {
            textNodes.push(node)
          }

          if (textNodes.length > 0) {
            // Create a new range that only includes the main text
            const newRange = document.createRange()
            newRange.setStart(textNodes[0], 0)
            newRange.setEnd(textNodes[textNodes.length - 1], textNodes[textNodes.length - 1].textContent?.length || 0)
            
            selection.removeAllRanges()
            selection.addRange(newRange)
          }
        } catch (error) {
          // If anything goes wrong, just leave the selection as is
          console.warn('Selection cleanup failed:', error)
        }
      }
    }

    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [])

  return null
} 