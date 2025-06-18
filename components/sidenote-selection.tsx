"use client"

import { useEffect } from 'react'

export function SidenoteSelection() {
  let isSelectingInNote = false
  let currentSelectingNote: HTMLElement | null = null

  useEffect(() => {
    // Handle mouse down events for note selection
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const sidenote = target.closest('.sidenote') as HTMLElement
      const marginnote = target.closest('.marginnote') as HTMLElement
      
      // Clear all previous selecting states
      document.querySelectorAll('.sidenote.selecting, .marginnote.selecting').forEach(el => {
        el.classList.remove('selecting')
      })
      
      if (sidenote) {
        isSelectingInNote = true
        currentSelectingNote = sidenote
        sidenote.classList.add('selecting')
        
        // Enable selection for the entire document temporarily
        document.body.style.userSelect = 'text'
        document.body.style.webkitUserSelect = 'text'
      } else if (marginnote) {
        isSelectingInNote = true
        currentSelectingNote = marginnote
        marginnote.classList.add('selecting')
        
        // Enable selection for the entire document temporarily
        document.body.style.userSelect = 'text'
        document.body.style.webkitUserSelect = 'text'
      } else {
        isSelectingInNote = false
        currentSelectingNote = null
        
        // Reset document selection
        document.body.style.userSelect = ''
        document.body.style.webkitUserSelect = ''
      }
    }

    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        return
      }

      const range = selection.getRangeAt(0)

      // If user is selecting within a note, constrain to that note
      if (isSelectingInNote && currentSelectingNote) {
        const startContainer = range.startContainer
        const endContainer = range.endContainer
        
        // Check if either the start or end has moved outside the note
        const startInNote = currentSelectingNote.contains(startContainer)
        const endInNote = currentSelectingNote.contains(endContainer)
        
        if (!startInNote || !endInNote) {
          try {
            const newRange = document.createRange()
            
            // If start is outside note, use first text node in note as start
            if (!startInNote) {
              const walker = document.createTreeWalker(
                currentSelectingNote,
                NodeFilter.SHOW_TEXT,
                null
              )
              const firstTextNode = walker.nextNode()
              if (firstTextNode) {
                newRange.setStart(firstTextNode, 0)
              }
            } else {
              newRange.setStart(range.startContainer, range.startOffset)
            }
            
            // If end is outside note, use last text node in note as end
            if (!endInNote) {
              const walker = document.createTreeWalker(
                currentSelectingNote,
                NodeFilter.SHOW_TEXT,
                null
              )
              let lastTextNode = null
              let node
              while (node = walker.nextNode()) {
                lastTextNode = node
              }
              
              if (lastTextNode) {
                newRange.setEnd(lastTextNode, lastTextNode.textContent?.length || 0)
              }
            } else {
              newRange.setEnd(range.endContainer, range.endOffset)
            }
            
            selection.removeAllRanges()
            selection.addRange(newRange)
          } catch (error) {
            console.warn('Note selection constraint failed:', error)
          }
        }
        return
      }

      // If selecting in main text, filter out note content
      const commonAncestor = range.commonAncestorContainer
      const containerElement = commonAncestor.nodeType === Node.TEXT_NODE 
        ? commonAncestor.parentElement 
        : commonAncestor as HTMLElement

      if (containerElement && containerElement.querySelector && 
          (containerElement.querySelector('.sidenote') || containerElement.querySelector('.marginnote'))) {
        
        // Selection contains notes, we need to clean it up
        try {
          // Get all text nodes in the selection, excluding those in notes
          const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                // Reject text nodes that are inside notes
                const parent = node.parentElement
                if (parent && (parent.closest('.sidenote') || parent.closest('.marginnote'))) {
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
          console.warn('Selection cleanup failed:', error)
        }
      }
    }

    const handleMouseUp = () => {
      // Small delay to allow selection to complete
      setTimeout(() => {
        const selection = window.getSelection()
        const selectedText = selection?.toString().trim() || ''
        
        if (selectedText === '') {
          // No text selected, can disable selection
          document.querySelectorAll('.sidenote.selecting, .marginnote.selecting').forEach(el => {
            el.classList.remove('selecting')
          })
          document.body.style.userSelect = ''
          document.body.style.webkitUserSelect = ''
          isSelectingInNote = false
          currentSelectingNote = null
        }
      }, 10)
    }

    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useEffect(() => {
    // Ensure in-text superscript links navigate to footnotes on mobile/tablet.
    // Problem: both the hidden .sidenote span and the footnote <li> share the same id (e.g., "sidenote-1").
    // Browsers jump to the *first* element with the id, which is the hidden sidenote span, so scrolling appears broken.
    // Solution: When the viewport is <= 1050px (our `desktop` breakpoint), temporarily remove the id attribute from the hidden sidenote spans.
    // When the viewport is > 1050px, restore the ids so links jump to the visible sidenotes again.

    const DESKTOP_BREAKPOINT = 1050 // keep in sync with Tailwind `desktop` screen

    const updateSidenoteIds = () => {
      const isMobile = window.innerWidth <= DESKTOP_BREAKPOINT
      const sidenoteEls = document.querySelectorAll<HTMLElement>('.sidenote, .marginnote')
      sidenoteEls.forEach((el) => {
        const currentId = el.getAttribute('id')
        const storedOriginal = el.getAttribute('data-orig-id')

        if (isMobile) {
          // If id exists, stash it and remove it to avoid duplicate ids
          if (currentId) {
            el.setAttribute('data-orig-id', currentId)
            el.removeAttribute('id')
          }
        } else {
          // On desktop, ensure the element *has* its original id
          const idToRestore = storedOriginal || currentId
          if (idToRestore && !el.getAttribute('id')) {
            el.setAttribute('id', idToRestore)
          }
        }
      })
    }

    // Initial run
    updateSidenoteIds()

    // Listen for viewport size changes
    window.addEventListener('resize', updateSidenoteIds)

    // Intercept clicks on superscript links for consistent animation behavior
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a.sidenote-number') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href') || ''
      if (!href.startsWith('#')) return

      const targetId = href.slice(1)
      const targetEl = document.getElementById(targetId)
      
      if (!targetEl) return

      const isMobile = window.innerWidth <= DESKTOP_BREAKPOINT

      // Always prevent default and handle manually for consistent behavior
      e.preventDefault()

      if (isMobile) {
        // Smooth scroll to target on mobile
        document.documentElement.style.scrollBehavior = 'smooth'
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => {
          document.documentElement.style.scrollBehavior = ''
        }, 600)
      }

      // Always use manual animation approach for consistency
      const isDark = document.documentElement.classList.contains('dark')
      const animationClass = isDark ? 'highlight-replay-dark' : 'highlight-replay'
      
      // Remove any existing animation classes
      targetEl.classList.remove(animationClass)
      void targetEl.offsetWidth // force reflow
      
      // Add the animation class
      targetEl.classList.add(animationClass)
      
      // Clean up after animation
      targetEl.addEventListener('animationend', () => {
        targetEl.classList.remove(animationClass)
      }, { once: true })
      
      // Also set hash for proper URL behavior (after a small delay to avoid conflicts)
      setTimeout(() => {
        location.hash = href
      }, 50)
    }

    document.addEventListener('click', handleAnchorClick)

    // Handle clicks on return links from sidenotes/footnotes to highlight corresponding text
    const handleReturnLinkClick = (e: MouseEvent) => {
      const returnLink = (e.target as HTMLElement).closest('a.sidenote-counter, a.footnote-number-link') as HTMLAnchorElement | null
      if (!returnLink) return

      const href = returnLink.getAttribute('href') || ''
      if (!href.startsWith('#')) return

      // Don't prevent default - let normal navigation work
      // e.preventDefault()
      
      const targetId = href.slice(1)
      const targetEl = document.getElementById(targetId)
      
      if (!targetEl) return

      // Simple approach: just highlight the parent paragraph or wrapper containing the superscript
      const textToHighlight = targetEl.closest('p, div, li, blockquote') as HTMLElement || targetEl.parentElement
      if (!textToHighlight) return

      // Apply highlight animation with a delay to allow navigation to complete
      setTimeout(() => {
        const isDark = document.documentElement.classList.contains('dark')
        const animationClass = isDark ? 'text-highlight-dark' : 'text-highlight'
        
        // Remove existing highlights
        textToHighlight.classList.remove(animationClass)
        void textToHighlight.offsetWidth // force reflow
        
        // Add highlight
        textToHighlight.classList.add(animationClass)
        
        // Clean up after animation
        textToHighlight.addEventListener('animationend', () => {
          textToHighlight.classList.remove(animationClass)
        }, { once: true })
      }, 100)
    }

    document.addEventListener('click', handleReturnLinkClick)

    // Observe DOM mutations to catch late-rendered sidenotes (e.g. MDX content)
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.classList.contains('sidenote') || node.classList.contains('marginnote') || node.querySelector('.sidenote, .marginnote')) {
              shouldUpdate = true
            }
          }
        })
      }
      if (shouldUpdate) {
        updateSidenoteIds()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('resize', updateSidenoteIds)
      document.removeEventListener('click', handleAnchorClick)
      document.removeEventListener('click', handleReturnLinkClick)
      observer.disconnect()
    }
  }, [])

  return null
} 