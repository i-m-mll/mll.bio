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
  return (tree: any, file: any) => {
    transformChildren(tree, file)
  }
}

function transformChildren(node: any, file: any): void {
  if (!Array.isArray(node.children)) return

  node.children = node.children.map((child: any) => transformNode(child, file))
}

function transformNode(node: any, file: any): any {
  transformChildren(node, file)

  if (!isDirectiveNode(node)) return node

  if (node.type === "textDirective") {
    const componentName = INLINE_COMPONENTS[node.name]
    if (!componentName) return unknownDirectiveElement(node, file)

    return {
      type: "mdxJsxTextElement",
      name: componentName,
      attributes: attributesToMdx(node.attributes),
      children: node.children ?? [],
    }
  }

  if (node.type === "containerDirective") {
    const componentName = CONTAINER_COMPONENTS[node.name]
    if (!componentName) return unknownDirectiveElement(node, file)

    const { label: maybeLabel, children } = extractDirectiveLabel(node.name, node.children ?? [])
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
  if (!componentName) return unknownDirectiveElement(node, file)

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

  const mdxAttributes: any[] = []
  Object.entries(attributes).forEach(([name, value]) => {
    if (value === undefined) return
    mdxAttributes.push({
      type: "mdxJsxAttribute",
      name,
      value: value === null ? null : String(value),
    })
  })
  return mdxAttributes
}

function extractDirectiveLabel(directiveName: string, children: any[]): { label: string | null; children: any[] } {
  if (!children.length) return { label: null, children }
  const firstChild = children[0]
  if (firstChild.type !== "paragraph" || !firstChild.data?.directiveLabel) {
    return { label: null, children }
  }
  if (!LABEL_PROP_BY_DIRECTIVE[directiveName]) return { label: null, children }

  return {
    label: textFromNode(firstChild).trim() || null,
    children: children.slice(1),
  }
}

function textFromNode(node: any): string {
  if (node.type === "text" || node.type === "inlineCode") return node.value ?? ""
  if (Array.isArray(node.children)) return node.children.map(textFromNode).join("")
  return ""
}

function unknownDirectiveElement(node: any, file: any): any {
  warnUnknownDirective(node, file)

  const tagName = node.type === "textDirective" ? "span" : "div"
  const elementType = node.type === "textDirective" ? "mdxJsxTextElement" : "mdxJsxFlowElement"
  const children = node.children ?? []
  const devPlaceholder = process.env.NODE_ENV !== "production"
    ? unknownDirectiveChildren(node)
    : []

  return {
    type: elementType,
    name: tagName,
    attributes: [
      { type: "mdxJsxAttribute", name: "data-unknown-directive", value: node.name },
    ],
    children: [...devPlaceholder, ...children],
  }
}

function unknownDirectiveChildren(node: any): any[] {
  const message = `Unknown directive: ${node.name}`
  if (node.type === "textDirective") {
    return [{ type: "text", value: message }]
  }

  return [
    {
      type: "paragraph",
      children: [{ type: "text", value: message }],
    },
  ]
}

function warnUnknownDirective(node: any, file: any): void {
  const path = file?.path || file?.history?.[0] || "unknown file"
  const position = node.position?.start
  const location = position ? `:${position.line}:${position.column}` : ""
  const known = [...new Set([
    ...Object.keys(INLINE_COMPONENTS),
    ...Object.keys(CONTAINER_COMPONENTS),
    ...Object.keys(LEAF_COMPONENTS),
  ])].sort().join(", ")
  const reason = `Unknown markdown directive "${node.name}" in ${path}${location}. Known directives: ${known}.`

  try {
    file?.message?.(reason, node, "remark-directives-to-jsx:unknown-directive")
  } catch {
    // Keep the console warning even if the host file object cannot record messages.
  }

  console.warn(`[remark-directives-to-jsx] ${reason}`)
}
