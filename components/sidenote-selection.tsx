"use client"

import { useEffect } from 'react'
import { uiConfig } from '@/lib/config/ui'

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
            // Create a new range that only includes the main text while
            // *preserving* the user's original start/end positions whenever they
            // are already outside sidelined content. This prevents the selection
            // from being reset when the drag direction is backwards.
            const newRange = document.createRange()

            // Helper to know if a node is inside any sidenote / marginnote
            const isInsideNote = (node: Node | null) => {
              if (!node) return false
              const el = node.nodeType === Node.TEXT_NODE ? (node.parentElement) : (node as HTMLElement)
              return !!el?.closest('.sidenote, .marginnote')
            }

            // Determine safe start boundary
            const startNodeInNote = isInsideNote(range.startContainer)
            const startNode = startNodeInNote ? textNodes[0] : range.startContainer
            const startOffset = startNodeInNote ? 0 : range.startOffset

            // Determine safe end boundary
            const endNodeInNote = isInsideNote(range.endContainer)
            const endNode = endNodeInNote ? textNodes[textNodes.length - 1] : range.endContainer
            const endOffset = endNodeInNote ? (endNode.textContent?.length || 0) : range.endOffset

            newRange.setStart(startNode, startOffset)
            newRange.setEnd(endNode, endOffset)

            // Apply the refined range while trying to preserve selection
            // direction (anchor/focus). We capture them *before* resetting so
            // we can restore afterwards.
            const anchorNode = selection.anchorNode
            const anchorOffset = selection.anchorOffset
            const focusNode = selection.focusNode
            const focusOffset = selection.focusOffset

            selection.removeAllRanges()
            selection.addRange(newRange)

            // If the original anchor/focus were outside notes, restore them so
            // backwards selections remain backwards. If either boundary was
            // inside a note we simply keep the forward range – this mirrors the
            // browser's own behaviour when the anchor/focus become invalid.
            if (!isInsideNote(anchorNode) && !isInsideNote(focusNode)) {
              try {
                selection.setBaseAndExtent(anchorNode!, anchorOffset, focusNode!, focusOffset)
              } catch {
                /* Fallback: leave the range as-is if the browser rejects the call */
              }
            }
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
    // Helper to watch for the end of a scroll event – extracted so it can be
    // reused without relying on viewport-resize hacks that are no longer
    // necessary now that sidenote/footnote IDs are unique.
    const onScrollEnd = (callback: () => void) => {
      let scrollTimeout: number
      const scrollListener = () => {
        window.clearTimeout(scrollTimeout)
        scrollTimeout = window.setTimeout(() => {
          window.removeEventListener('scroll', scrollListener)
          callback()
        }, 100) // 100 ms of idle time = scroll ended
      }
      window.addEventListener('scroll', scrollListener)
    }

    // Helper to minimally scroll element into view with configurable padding
    const scrollElementIntoView = (el: HTMLElement): boolean => {
      if (!el) return false

      const padding = uiConfig.navigation.anchorScrollPaddingPx
      const viewportHeight = window.innerHeight
      const rect = el.getBoundingClientRect()
      let didScroll = false

      // If element taller than viewport - 2*padding, align its top with padding
      if (rect.height + padding * 2 > viewportHeight) {
        const delta = rect.top - padding
        if (delta !== 0) {
          window.scrollBy({ top: delta, left: 0, behavior: 'smooth' })
          didScroll = true
        }
      } else if (rect.top < padding) {
        window.scrollBy({ top: rect.top - padding, left: 0, behavior: 'smooth' })
        didScroll = true
      } else if (rect.bottom > viewportHeight - padding) {
        window.scrollBy({ top: rect.bottom - (viewportHeight - padding), left: 0, behavior: 'smooth' })
        didScroll = true
      }

      return didScroll
    }

    // Helper to apply selection-style highlight to a container's content
    const applySelectionHighlight = (
      containerEl: HTMLElement,
      staticClass: string,
      animationClass: string,
      onEnd: (startFade: () => void) => void
    ) => {
      // Create a wrapper span for the content
      const wrapper = document.createElement('span')
      wrapper.className = staticClass

      // Move all children of the container into the wrapper
      while (containerEl.firstChild) {
        wrapper.appendChild(containerEl.firstChild)
      }
      // Put the wrapper inside the container
      containerEl.appendChild(wrapper)

      const startFade = () => {
        wrapper.classList.remove(staticClass)
        wrapper.classList.add(animationClass)

        const onAnimationEnd = () => {
          // Animation finished, unwrap the content
          const parent = wrapper.parentNode
          if (parent) {
            while (wrapper.firstChild) {
              parent.insertBefore(wrapper.firstChild, wrapper)
            }
            parent.removeChild(wrapper)
          }
          wrapper.removeEventListener('animationend', onAnimationEnd)
        }
        wrapper.addEventListener('animationend', onAnimationEnd)
      }

      onEnd(startFade)
    }

    // Intercept clicks on superscript links for consistent animation behavior
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a.sidenote-number') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href') || ''
      if (!href.startsWith('#')) return

      const targetId = href.slice(1)
      const targetEl = document.getElementById(targetId)
      
      if (!targetEl) return

      // Prevent default automatic jump
      e.preventDefault()

      // If the target is a footnote, we want to highlight the content, not the whole item
      let elementToHighlight = targetEl
      if (targetEl.classList.contains('footnote-item')) {
        const contentEl = targetEl.querySelector<HTMLElement>('.footnote-content')
        if (contentEl) {
          elementToHighlight = contentEl
        }
      }

      // Minimal scroll to make sidenote fully visible (still scroll the container)
      const didScroll = scrollElementIntoView(targetEl)

      // Update URL hash without additional scrolling
      history.replaceState(null, '', href)

      // Highlight main text
      const textToHighlight = targetEl
      const isDark = document.documentElement.classList.contains('dark')
      const staticClass = 'static-text-selection-highlight'
      const animationClass = isDark ? 'text-selection-highlight-animation-dark' : 'text-selection-highlight-animation'

      applySelectionHighlight(textToHighlight, staticClass, animationClass, (startFade) => {
        if (didScroll) {
          onScrollEnd(startFade)
        } else {
          startFade()
        }
      })
    }

    document.addEventListener('click', handleAnchorClick)

    // Handle clicks on return links from sidenotes/footnotes to highlight corresponding text
    const handleReturnLinkClick = (e: MouseEvent) => {
      const returnLink = (e.target as HTMLElement).closest('a.sidenote-counter, a.footnote-number-link') as HTMLAnchorElement | null
      if (!returnLink) return

      const href = returnLink.getAttribute('href') || ''
      if (!href.startsWith('#')) return

      // Prevent default navigation
      e.preventDefault()

      const targetId = href.slice(1)
      const targetEl = document.getElementById(targetId)
      
      if (!targetEl) return

      // Scroll superscript (or its parent line) into view minimal
      const lineEl = targetEl.closest('p, div, li, blockquote') as HTMLElement || targetEl
      const didScroll = scrollElementIntoView(lineEl)

      // Update URL hash
      history.replaceState(null, '', href)

      // Highlight main text
      const textToHighlight = lineEl
      const isDark = document.documentElement.classList.contains('dark')
      const staticClass = 'static-text-selection-highlight'
      const animationClass = isDark ? 'text-selection-highlight-animation-dark' : 'text-selection-highlight-animation'

      applySelectionHighlight(textToHighlight, staticClass, animationClass, (startFade) => {
        if (didScroll) {
          onScrollEnd(startFade)
        } else {
          startFade()
        }
      })
    }

    document.addEventListener('click', handleReturnLinkClick)

    // Observe DOM mutations to catch late-rendered sidenotes (e.g. MDX content)
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (
              node.classList.contains('sidenote') ||
              node.classList.contains('marginnote') ||
              node.querySelector('.sidenote, .marginnote')
            ) {
              shouldUpdate = true
            }
          }
        })
      }
      if (shouldUpdate) {
        // No id juggling needed any more – mutation observer kept for future
        // enhancements but left empty.
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    // Clean-up
    return () => {
      document.removeEventListener('click', handleAnchorClick)
      document.removeEventListener('click', handleReturnLinkClick)
      observer.disconnect()
    }
  }, [])

  return null
} 