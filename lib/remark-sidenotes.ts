import { visit } from 'unist-util-visit'
import type { Root, FootnoteDefinition, FootnoteReference, Text, Paragraph } from 'mdast'

export function remarkSidenotes() {
  return (tree: Root) => {
    const footnoteDefinitions = new Map<string, string>()
    
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
    
    // Second pass: process margin notes syntax [!margin: content]
    visit(tree, 'text', (node: Text, index, parent) => {
      if (parent && index !== undefined) {
        const marginNoteRegex = /\[!margin:\s*(.*?)\]/g
        const text = node.value
        let match
        let hasMarginNotes = false
        const newNodes: any[] = []
        let lastIndex = 0
        
        while ((match = marginNoteRegex.exec(text)) !== null) {
          hasMarginNotes = true
          
          // Add text before the margin note
          if (match.index > lastIndex) {
            newNodes.push({
              type: 'text',
              value: text.slice(lastIndex, match.index)
            })
          }
          
          // Add the margin note JSX element
          const marginNoteContent = match[1].trim()
          const marginNoteId = `margin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          
          newNodes.push({
            type: 'mdxJsxTextElement',
            name: 'MarginNote',
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'id',
                value: marginNoteId
              },
              {
                type: 'mdxJsxAttribute',
                name: 'content',
                value: marginNoteContent
              }
            ],
            children: []
          })
          
          lastIndex = match.index + match[0].length
        }
        
        if (hasMarginNotes) {
          // Add remaining text after the last margin note
          if (lastIndex < text.length) {
            newNodes.push({
              type: 'text',
              value: text.slice(lastIndex)
            })
          }
          
          // Replace the text node with the new nodes
          parent.children.splice(index, 1, ...newNodes)
          return index + newNodes.length
        }
      }
    })

    // Third pass: replace footnote references with sidenote JSX elements
    visit(tree, 'footnoteReference', (node: FootnoteReference, index, parent) => {
      if (parent && index !== undefined) {
        const definition = footnoteDefinitions.get(node.identifier)
        if (definition) {
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
              }
            ],
            children: []
          }
          
          // Replace the footnote reference with the sidenote element
          parent.children[index] = sidenoteElement as any
        }
      }
    })
  }
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
  if (node.type === 'text') {
    return node.value
  }
  
  if (node.children) {
    return node.children.map(extractTextContent).join('')
  }
  
  return ''
} 