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