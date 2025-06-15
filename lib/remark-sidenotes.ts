import { visit } from 'unist-util-visit'
import type { Root, FootnoteDefinition, FootnoteReference } from 'mdast'

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
    
    // Second pass: replace footnote references with sidenote JSX elements
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