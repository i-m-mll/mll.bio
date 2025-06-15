import { visit } from 'unist-util-visit'
import { toString } from 'hast-util-to-string'

export function rehypeHeadingIds() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)) {
        const text = toString(node)
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
        
        if (!node.properties) {
          node.properties = {}
        }
        
        if (!node.properties.id) {
          node.properties.id = id
        }
      }
    })
  }
} 