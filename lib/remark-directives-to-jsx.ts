import type { Plugin } from "unified"
import type { Root } from "mdast"

const INLINE_COMPONENTS: Record<string, string> = {
  "margin-note": "MarginNote",
  "diff-add": "DiffAdd",
  "diff-del": "DiffDel",
}

const CONTAINER_COMPONENTS: Record<string, string> = {
  "note-scope": "NoteScope",
  "margin-note": "MarginNote",
  tabs: "Tabs",
  tab: "Tab",
  "chat-log": "ChatLog",
  "chat-message": "ChatMessage",
  "thinking-block": "ThinkingBlock",
  "tool-use": "ToolUse",
  "diff-add-block": "DiffAddBlock",
  "diff-del-block": "DiffDelBlock",
  "info-callout": "InfoCallout",
  "notation-callout": "NotationCallout",
  "string-diagram-callout": "StringDiagramCallout",
  "caption-callout": "CaptionCallout",
  "collapsible-callout": "CollapsibleCallout",
}

const LEAF_COMPONENTS: Record<string, string> = {
  figure: "Figure",
  "spotify-embed": "SpotifyEmbed",
  "youtube-embed": "YouTubeEmbed",
}

const LABEL_PROP_BY_DIRECTIVE: Record<string, string> = {
  "collapsible-callout": "title",
  "info-callout": "title",
  "notation-callout": "title",
  "string-diagram-callout": "title",
  "caption-callout": "title",
}

export const remarkDirectivesToJsx: Plugin<[], Root> = () => {
  return (tree: any) => {
    transformChildren(tree)
  }
}

function transformChildren(node: any): void {
  if (!Array.isArray(node.children)) return

  node.children = node.children.map((child: any) => transformNode(child))
}

function transformNode(node: any): any {
  transformChildren(node)

  if (!isDirectiveNode(node)) return node

  if (node.type === "textDirective") {
    const componentName = INLINE_COMPONENTS[node.name]
    if (!componentName) return node

    return {
      type: "mdxJsxTextElement",
      name: componentName,
      attributes: attributesToMdx(node.attributes),
      children: node.children ?? [],
    }
  }

  if (node.type === "containerDirective") {
    const componentName = CONTAINER_COMPONENTS[node.name]
    if (!componentName) return node

    const children = node.children ?? []
    const maybeLabel = extractDirectiveLabel(node.name, children)
    const attributes = attributesToMdx(node.attributes)

    if (maybeLabel && LABEL_PROP_BY_DIRECTIVE[node.name]) {
      const labelProp = LABEL_PROP_BY_DIRECTIVE[node.name]
      if (!attributes.some((attr: any) => attr.name === labelProp)) {
        attributes.push({
          type: "mdxJsxAttribute",
          name: labelProp,
          value: maybeLabel,
        })
      }
    }

    return {
      type: "mdxJsxFlowElement",
      name: componentName,
      attributes,
      children,
    }
  }

  const componentName = LEAF_COMPONENTS[node.name]
  if (!componentName) return node

  return {
    type: "mdxJsxFlowElement",
    name: componentName,
    attributes: attributesToMdx(node.attributes),
    children: [],
  }
}

function isDirectiveNode(node: any): boolean {
  return (
    node?.type === "textDirective" ||
    node?.type === "containerDirective" ||
    node?.type === "leafDirective"
  )
}

function attributesToMdx(attributes?: Record<string, string | null | undefined>): any[] {
  if (!attributes) return []
  return Object.entries(attributes).flatMap(([name, value]) => {
    if (value === undefined || value === null) return []
    return [{ type: "mdxJsxAttribute", name, value: String(value) }]
  })
}

function extractDirectiveLabel(directiveName: string, children: any[]): string | null {
  if (!children.length) return null
  const firstChild = children[0]
  if (firstChild.type !== "paragraph" || !firstChild.data?.directiveLabel) return null
  if (!LABEL_PROP_BY_DIRECTIVE[directiveName]) return null

  children.shift()
  return textFromNode(firstChild).trim() || null
}

function textFromNode(node: any): string {
  if (node.type === "text" || node.type === "inlineCode") return node.value ?? ""
  if (Array.isArray(node.children)) return node.children.map(textFromNode).join("")
  return ""
}
