import { visit, SKIP } from 'unist-util-visit'
import type { Root, FootnoteDefinition, FootnoteReference, Text, Paragraph } from 'mdast'

export function remarkSidenotes() {
  return (tree: Root) => {
    const footnoteDefinitions = new Map<string, string>()
    let sidenoteCounter = 0
    
    // First pass: collect footnote definitions and remove them
    visit(tree, 'footnoteDefinition', (node: FootnoteDefinition, index, parent) => {
      if (parent && index !== undefined) {
        // Extract text content from the definition
        const textContent = extractTextContent(node)
        
        // Skip footnote definitions that are too short or look like code examples
        // This helps avoid processing inline code examples as real footnotes
        if (textContent.length < 15 || isLikelyCodeExample(textContent, node)) {
          return // Don't process this footnote, leave it as-is
        }
        
        footnoteDefinitions.set(node.identifier, textContent)
        
        // Remove the footnote definition from the tree
        parent.children.splice(index, 1)
        return index
      }
    })

    // Second pass: replace footnote references with sidenote JSX elements
    visit(tree, 'footnoteReference', (node: FootnoteReference, index, parent) => {
      if (parent && index !== undefined) {
        const definition = footnoteDefinitions.get(node.identifier)
        if (definition) {
          sidenoteCounter++
          
          // Create a JSX element for the sidenote
          const sidenoteElement = {
            type: 'mdxJsxTextElement',
            name: 'Sidenote',
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'id',
                value: node.identifier
              },
              {
                type: 'mdxJsxAttribute', 
                name: 'content',
                value: definition
              },
              {
                type: 'mdxJsxAttribute',
                name: 'number',
                value: sidenoteCounter.toString()
              }
            ],
            children: []
          }
          
          // Replace the footnote reference with the sidenote element
          parent.children[index] = sidenoteElement as any
        }
      }
    })

    // Third pass: process NoteScope blocks and MarginNote target positioning
    let noteScopeCount = 0
    visit(tree, 'mdxJsxFlowElement', (node: any) => {
      if (node.name === 'NoteScope') {
        noteScopeCount++
        
        // Strip whitespace around MarginNote elements
        stripWhitespaceAroundMarginNotes(node)
        
        processNoteScopeTargets(node)
      }
    })
  }
}

// Mark MarginNote elements that should not affect document flow
function stripWhitespaceAroundMarginNotes(noteScopeNode: any) {
  if (!noteScopeNode.children) return

  const children = noteScopeNode.children

  // Iterate in reverse to safely splice while iterating
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i]
    const isMarginNote =
      (child.type === 'mdxJsxTextElement' || child.type === 'mdxJsxFlowElement') &&
      child.name === 'MarginNote'

    if (isMarginNote) {
      // Remove whitespace-only text node BEFORE the MarginNote
      if (i > 0) {
        const prev = children[i - 1]
        if (prev.type === 'text' && /^\s*$/.test(prev.value)) {
          children.splice(i - 1, 1)
          i-- // Adjust index as we removed one element before current
        }
      }

      // Remove whitespace-only text node AFTER the MarginNote
      if (i < children.length - 1) {
        const next = children[i + 1]
        if (next.type === 'text' && /^\s*$/.test(next.value)) {
          children.splice(i + 1, 1)
        }
      }

      // Ensure positioned notes are marked so they don't affect flow in React"
      markMarginNoteAsPositioned(child)
    }
  }
}

// Mark a MarginNote as positioned if it has top or target attributes
function markMarginNoteAsPositioned(marginNoteNode: any) {
  const hasTopAttr = marginNoteNode.attributes?.find((attr: any) => attr.name === 'top')
  const hasTargetAttr = marginNoteNode.attributes?.find((attr: any) => attr.name === 'target')
  const hasDataTargetPosition = marginNoteNode.attributes?.find((attr: any) => attr.name === 'dataTargetPosition')
  
  // If this MarginNote has positioning attributes, mark it as positioned
  if (hasTopAttr || hasTargetAttr || hasDataTargetPosition) {
    marginNoteNode.attributes = marginNoteNode.attributes || []
    
    // Add a data attribute to indicate this should not affect document flow
    const existingDataPositioned = marginNoteNode.attributes.find((attr: any) => attr.name === 'dataPositioned')
    if (!existingDataPositioned) {
      marginNoteNode.attributes.push({
        type: 'mdxJsxAttribute',
        name: 'dataPositioned',
        value: 'true'
      })
    }
  }
}

// Process MarginNote elements with target props within a NoteScope
function processNoteScopeTargets(noteScopeNode: any) {
  const scopeTextContent = extractAllTextFromNode(noteScopeNode)
  
  // Collect all MarginNote elements that need processing first
  const notesToProcess: Array<{node: any, index: number, parent: any, type: 'text' | 'flow'}> = []
  
  // Find all MarginNote elements within this scope (check both text and flow elements)
  visit(noteScopeNode, 'mdxJsxTextElement', (marginNoteNode: any, index: number | undefined, parent: any) => {
    if (marginNoteNode.name === 'MarginNote') {
      const targetAttr = marginNoteNode.attributes?.find((attr: any) => attr.name === 'target')
      
      if (targetAttr && targetAttr.value && parent && index !== undefined) {
        notesToProcess.push({node: marginNoteNode, index, parent, type: 'text'})
      }
    }
  })
  
  // Also check for flow elements
  visit(noteScopeNode, 'mdxJsxFlowElement', (marginNoteNode: any, index: number | undefined, parent: any) => {
    if (marginNoteNode.name === 'MarginNote') {
      const targetAttr = marginNoteNode.attributes?.find((attr: any) => attr.name === 'target')
      
      if (targetAttr && targetAttr.value && parent && index !== undefined) {
        notesToProcess.push({node: marginNoteNode, index, parent, type: 'flow'})
      }
    }
  })
  
  // Process notes in reverse order to maintain correct indices when removing
  notesToProcess.reverse().forEach(({node: marginNoteNode, index, parent, type}) => {
    const targetAttr = marginNoteNode.attributes?.find((attr: any) => attr.name === 'target')
    const targetText = targetAttr.value
    const position = findTextPosition(scopeTextContent, targetText, noteScopeNode)
    
    if (position === null) {
      throw new Error(`Target text "${targetText}" not found in NoteScope. Build failed to ensure content accuracy.`)
    }
    
    // Add positioning data attributes to the MarginNote
    marginNoteNode.attributes = marginNoteNode.attributes || []
    marginNoteNode.attributes.push({
      type: 'mdxJsxAttribute',
      name: 'dataTargetPosition',
      value: position.toString()
    })

    if (targetInCodeBlock(noteScopeNode, targetText)) {
      marginNoteNode.attributes.push({
        type: 'mdxJsxAttribute',
        name: 'dataInCode',
        value: 'true'
      })
    }
    
    // For positioned notes, create a duplicate for mobile display
    const mobileMarginNote = createMobileMarginNote(marginNoteNode, targetInCodeBlock(noteScopeNode, targetText))
    
    // Remove the original note from its current position FIRST
    parent.children.splice(index, 1)
    
    // Create a clean desktop version (without mobile attributes)
    const desktopMarginNote = JSON.parse(JSON.stringify(marginNoteNode)) // Clone for desktop
    desktopMarginNote.attributes = desktopMarginNote.attributes?.filter((attr: any) => attr.name !== 'dataMobileVersion') || []
    
    // Inject the desktop version inline at the target text location (for non-code targets)
    if (!targetInCodeBlock(noteScopeNode, targetText)) {
      injectMarginNoteAtTarget(noteScopeNode, desktopMarginNote, targetText)
      // Insert mobile version after the containing paragraph
      insertMobileMarginNoteAfterParagraph(noteScopeNode, mobileMarginNote, targetText)
    } else {
      // For code blocks, insert mobile version after the code block
      insertMobileMarginNoteAfterCodeBlock(noteScopeNode, mobileMarginNote)
      // Inject desktop version at the target location within the code block
      injectMarginNoteAtTarget(noteScopeNode, desktopMarginNote, targetText)
    }
    
    // Remove the target attribute since we've processed it
    marginNoteNode.attributes = marginNoteNode.attributes.filter((attr: any) => attr.name !== 'target')
  })
}

// Create a mobile version of a margin note with unique ID
function createMobileMarginNote(marginNoteNode: any, followsCodeBlock: boolean = false) {
  const mobileNote = JSON.parse(JSON.stringify(marginNoteNode)) // Deep clone
  
  // Add mobile-specific attributes
  mobileNote.attributes = mobileNote.attributes || []
  
  // Add attribute to mark this as mobile version
  mobileNote.attributes.push({
    type: 'mdxJsxAttribute',
    name: 'dataMobileVersion',
    value: 'true'
  })
  
  // Add attribute to indicate if this follows a code block
  if (followsCodeBlock) {
    mobileNote.attributes.push({
      type: 'mdxJsxAttribute',
      name: 'dataFollowsCode',
      value: 'true'
    })
  }
  
  // If there's an ID, modify it to prevent conflicts
  const idAttr = mobileNote.attributes.find((attr: any) => attr.name === 'id')
  if (idAttr) {
    idAttr.value = `${idAttr.value}-mobile`
  }
  
  return mobileNote
}

// Insert mobile margin note after the paragraph containing the target text
function insertMobileMarginNoteAfterParagraph(noteScopeNode: any, mobileMarginNote: any, targetText: string) {
  let inserted = false
  visit(noteScopeNode, (node: any, index: number | undefined, parent: any) => {
    if (inserted || !parent || index === undefined) return
    
    // Check if this is a paragraph that contains our target text
    if (node.type === 'paragraph') {
      const paragraphText = extractAllTextFromNode(node).toLowerCase()
      if (paragraphText.includes(targetText.toLowerCase())) {
        // Insert the mobile note after this paragraph
        parent.children.splice(index + 1, 0, mobileMarginNote)
        inserted = true
        return SKIP // Stop traversing once we've found and inserted
      }
    }
  })
}

// Insert mobile margin note after the code block
function insertMobileMarginNoteAfterCodeBlock(noteScopeNode: any, mobileMarginNote: any) {
  let inserted = false
  visit(noteScopeNode, (node: any, index: number | undefined, parent: any) => {
    if (inserted || !parent || index === undefined) return
    
    // Check if this is a code block
    if (node.type === 'code') {
      // Insert the mobile note after this code block
      parent.children.splice(index + 1, 0, mobileMarginNote)
      inserted = true
      return SKIP // Stop traversing once we've found and inserted
    }
  })
}

// Find the position of target text within the scope
function findTextPosition(scopeText: string, targetText: string, scopeNode: any): number | null {
  let searchText = targetText
  let isRegex = false
  
  // Check if target text is a regex pattern (starts and ends with /)
  if (targetText.startsWith('/') && targetText.endsWith('/')) {
    try {
      const regexPattern = targetText.slice(1, -1) // Remove the / delimiters
      const regex = new RegExp(regexPattern, 'i')
      const match = scopeText.match(regex)
      if (match) {
        const matchIndex = scopeText.indexOf(match[0])
        return calculateRelativePosition(matchIndex, scopeText, scopeNode)
      }
      return null
    } catch (e) {
      throw new Error(`Invalid regex pattern: ${targetText}`)
    }
  } else {
    // Simple string search
    const index = scopeText.toLowerCase().indexOf(targetText.toLowerCase())
    if (index === -1) return null
    
    return calculateRelativePosition(index, scopeText, scopeNode)
  }
}

// Calculate relative position within the scope (simplified - returns character position for now)
function calculateRelativePosition(textIndex: number, scopeText: string, scopeNode: any): number {
  // This is a simplified implementation that returns the character position
  // In a more sophisticated version, this would calculate the actual DOM element
  // position and convert to pixels or relative units
  
  // For now, we'll estimate based on line breaks and average line height
  const textBeforeTarget = scopeText.substring(0, textIndex)
  const lineBreaks = (textBeforeTarget.match(/\n/g) || []).length
  
  // Return line-based position (will be converted to pixels in CSS)
  return lineBreaks
}

// Extract all text content from a node and its children
function extractAllTextFromNode(node: any): string {
  let text = ''
  
  if (node.type === 'text') {
    return node.value
  }
  
  // Handle code blocks specifically
  if (node.type === 'code') {
    return node.value + '\n'
  }
  
  // Handle inline code
  if (node.type === 'inlineCode') {
    return node.value
  }
  
  if (node.children) {
    for (const child of node.children) {
      text += extractAllTextFromNode(child)
    }
  }
  
  // Add line breaks for block elements
  if (node.type === 'element' || node.type === 'mdxJsxFlowElement' || node.type === 'paragraph') {
    const blockElements = ['p', 'div', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    if (blockElements.includes(node.name || node.tagName) || node.type === 'paragraph') {
      text += '\n'
    }
  }
  
  // Skip MarginNote elements entirely when extracting text – they should not influence
  // target positioning calculations.
  if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === 'MarginNote') {
    return ''
  }
  
  return text
}

// Helper function to check if content looks like a code example
function isLikelyCodeExample(content: string, node: any): boolean {
  const trimmedContent = content.trim().toLowerCase()
  
  // Check for the specific problematic pattern from the demo
  if (trimmedContent === 'your sidenote content` for the definition') {
    return true
  }
  
  // Check for other common patterns that indicate this is a code example
  const codePatterns = [
    /^your sidenote content/i, // The specific example from the demo
    /^.*content.*for.*definition/i, // Generic example pattern
    /^\w+\s+(content|example|text)$/i, // Short placeholder text
    /content.*definition/i, // Generic pattern
    /for the definition$/i, // Ends with "for the definition"
  ]
  
  // Also check if the content is very generic/placeholder-like
  const isGeneric = trimmedContent.includes('your') && 
                   trimmedContent.includes('content')
  
  return codePatterns.some(pattern => pattern.test(trimmedContent)) || isGeneric
}

// Helper function to extract text content from footnote definition nodes
function extractTextContent(node: any): string {
  switch (node.type) {
    case 'text':
      return node.value
    case 'inlineCode':
      // Preserve backticks for inline code so downstream renderer can style it
      return `\`${node.value}\``
    case 'link':
      // Recreate markdown link syntax
      const linkText = node.children ? node.children.map(extractTextContent).join('') : ''
      const href = node.url || ''
      return `[${linkText}](${href})`
    case 'emphasis':
      // Preserve italic syntax
      const emText = node.children ? node.children.map(extractTextContent).join('') : ''
      return `*${emText}*`
    case 'strong':
      // Preserve bold syntax
      const strongText = node.children ? node.children.map(extractTextContent).join('') : ''
      return `**${strongText}**`
    default:
      if (node.children) {
        return node.children.map(extractTextContent).join('')
      }
      return ''
  }
}

// Helper to determine if target text exists inside a fenced code block within the NoteScope
function targetInCodeBlock(noteScopeNode: any, targetText: string): boolean {
  let foundInCode = false
  visit(noteScopeNode, 'code', (codeNode: any) => {
    // codeNode.value contains full text of code block
    if (targetText.startsWith('/') && targetText.endsWith('/')) {
      // regex pattern
      try {
        const regexPattern = targetText.slice(1, -1)
        const regex = new RegExp(regexPattern, 'i')
        if (regex.test(codeNode.value)) {
          foundInCode = true
        }
      } catch {}
    } else {
      if (codeNode.value.toLowerCase().includes(targetText.toLowerCase())) {
        foundInCode = true
      }
    }
  })
  return foundInCode
}

// Inject a MarginNote inline by wrapping the matched target text in a span
// with class "note-anchor-wrapper" followed by the MarginNote element.
function injectMarginNoteAtTarget(noteScopeNode: any, marginNoteNode: any, targetText: string) {
  let injected = false

  // First, specifically look for the target text inside inline links (<a href="…">text</a>)
  // so we can wrap the link node itself together with the MarginNote. This ensures
  // the note does not become part of the anchor element.
  visit(noteScopeNode, (node: any, index: number | undefined, parent: any) => {
    if (injected || !parent || index === undefined) return

    const isLinkNode =
      node.type === 'link' ||
      ((node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') && node.name === 'a')

    if (isLinkNode) {
      const linkText = extractAllTextFromNode(node).toLowerCase()
      if (linkText.includes(targetText.toLowerCase())) {
        // Build a wrapper span that contains the whole link and the note
        const wrapper = {
          type: 'mdxJsxTextElement',
          name: 'span',
          attributes: [
            { type: 'mdxJsxAttribute', name: 'className', value: 'note-anchor-wrapper' },
          ],
          children: [node, marginNoteNode],
        }

        // Replace the link node with the wrapper (note that `node` will now live inside wrapper)
        parent.children.splice(index, 1, wrapper)

        injected = true
        return SKIP
      }
    }
  })

  // Second, look for target text within code blocks
  visit(noteScopeNode, (node: any, index: number | undefined, parent: any) => {
    if (injected || !parent || index === undefined) return

    if (node.type === 'code') {
      const codeText = node.value.toLowerCase()
      const searchLower = targetText.toLowerCase()
      
      if (codeText.includes(searchLower)) {
        // For code blocks, we wrap the entire code block with the note
        const wrapper = {
          type: 'mdxJsxTextElement',
          name: 'span',
          attributes: [
            { type: 'mdxJsxAttribute', name: 'className', value: 'note-anchor-wrapper ends-with-pre' },
          ],
          children: [node, marginNoteNode],
        }

        // Replace the code block with the wrapper
        parent.children.splice(index, 1, wrapper)

        injected = true
        return SKIP
      }
    }
  })

  // Third, look for target text in regular text nodes
  visit(noteScopeNode, (node: any, index: number | undefined, parent: any) => {
    if (injected || !parent || index === undefined) return

    // Only operate on regular text nodes (skip code/inlineCode etc.)
    if (node.type === 'text') {
      const valueLower = node.value.toLowerCase()
      const searchLower = targetText.toLowerCase()
      const matchIndex = valueLower.indexOf(searchLower)

      if (matchIndex !== -1) {
        // Split the text node into before / matched / after parts
        const beforeText = node.value.slice(0, matchIndex)
        const matchedText = node.value.slice(matchIndex, matchIndex + targetText.length)
        const afterText = node.value.slice(matchIndex + targetText.length)

        // Build the wrapper element that contains the matched text and the note
        const wrapper = {
          type: 'mdxJsxTextElement',
          name: 'span',
          attributes: [
            { type: 'mdxJsxAttribute', name: 'className', value: 'note-anchor-wrapper' },
          ],
          children: [
            { type: 'text', value: matchedText },
            marginNoteNode,
          ],
        }

        const newNodes: any[] = []
        if (beforeText) newNodes.push({ type: 'text', value: beforeText })
        newNodes.push(wrapper)
        if (afterText) newNodes.push({ type: 'text', value: afterText })

        // Replace the original text node with the new sequence
        parent.children.splice(index, 1, ...newNodes)

        injected = true
        return SKIP
      }
    }
  })

  if (!injected) {
    // Fallback: if we didn't find the text node (edge cases, e.g., inside links), do nothing.
  }
} 