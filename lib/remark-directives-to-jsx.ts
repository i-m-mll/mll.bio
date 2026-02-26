import { visit, SKIP } from "unist-util-visit"
import type { Plugin } from "unified"
import type { Content, Paragraph, Root } from "mdast"

type DirectiveType = "textDirective" | "containerDirective" | "leafDirective"

interface DirectiveBase {
  type: DirectiveType
  name: string
  attributes?: Record<string, string | null | undefined>
  children?: Content[]
  data?: {
    directiveLabel?: boolean
  }
}

interface TextDirective extends DirectiveBase {
  type: "textDirective"
  children: Content[]
}

interface ContainerDirective extends DirectiveBase {
  type: "containerDirective"
  children: Content[]
}

interface LeafDirective extends DirectiveBase {
  type: "leafDirective"
}

type DirectiveNode = TextDirective | ContainerDirective | LeafDirective

interface MdxJsxAttribute {
  type: "mdxJsxAttribute"
  name: string
  value?: string | null
}

interface MdxJsxTextElement {
  type: "mdxJsxTextElement"
  name: string
  attributes: MdxJsxAttribute[]
  children: MdxContent[]
}

interface MdxJsxFlowElement {
  type: "mdxJsxFlowElement"
  name: string
  attributes: MdxJsxAttribute[]
  children: MdxContent[]
}

type MdxContent = Content | MdxJsxFlowElement | MdxJsxTextElement

interface MdxRoot extends Root {
  children: MdxContent[]
}

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
}

const LABEL_PROP_BY_DIRECTIVE: Record<string, string> = {
  "collapsible-callout": "title",
  "info-callout": "title",
  "notation-callout": "title",
  "string-diagram-callout": "title",
  "caption-callout": "title",
}

export const remarkDirectivesToJsx: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree as MdxRoot, (node, index, parent) => {
      if (!isDirectiveNode(node) || !parent || index === undefined) return

      if (node.type === "textDirective") {
        const componentName = INLINE_COMPONENTS[node.name]
        if (!componentName) return

        const textElement: MdxJsxTextElement = {
          type: "mdxJsxTextElement",
          name: componentName,
          attributes: attributesToMdx(node.attributes),
          children: (node.children ?? []) as MdxContent[],
        }

        parent.children[index] = textElement as MdxContent
        return SKIP
      }

      if (node.type === "containerDirective") {
        const componentName = CONTAINER_COMPONENTS[node.name]
        if (!componentName) return

        const children = (node.children ?? []) as MdxContent[]
        const maybeLabel = extractDirectiveLabel(node, children)
        const attributes = attributesToMdx(node.attributes)

        if (maybeLabel && LABEL_PROP_BY_DIRECTIVE[node.name]) {
          const labelProp = LABEL_PROP_BY_DIRECTIVE[node.name]
          if (!attributes.some((attr) => attr.name === labelProp)) {
            attributes.push({
              type: "mdxJsxAttribute",
              name: labelProp,
              value: maybeLabel,
            })
          }
        }

        const flowElement: MdxJsxFlowElement = {
          type: "mdxJsxFlowElement",
          name: componentName,
          attributes,
          children,
        }

        parent.children[index] = flowElement as MdxContent
        return SKIP
      }

      const componentName = LEAF_COMPONENTS[node.name]
      if (!componentName) return

      const leafElement: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: componentName,
        attributes: attributesToMdx(node.attributes),
        children: [],
      }

      parent.children[index] = leafElement as MdxContent
      return SKIP
    })
  }
}

function isDirectiveNode(node: unknown): node is DirectiveNode {
  if (!node || typeof node !== "object") return false
  const candidate = node as { type?: string }
  return (
    candidate.type === "textDirective" ||
    candidate.type === "containerDirective" ||
    candidate.type === "leafDirective"
  )
}

function attributesToMdx(attributes?: Record<string, string | null | undefined>): MdxJsxAttribute[] {
  if (!attributes) return []
  return Object.entries(attributes).flatMap(([name, value]) => {
    if (value === undefined || value === null) return []
    return [
      {
        type: "mdxJsxAttribute" as const,
        name,
        value: String(value),
      },
    ]
  })
}

function extractDirectiveLabel(node: ContainerDirective, children: MdxContent[]): string | null {
  if (!children.length) return null
  const firstChild = children[0]
  if (!isDirectiveLabelParagraph(firstChild)) return null
  if (!LABEL_PROP_BY_DIRECTIVE[node.name]) return null

  children.shift()
  const label = textFromNode(firstChild)
  return label.trim() === "" ? null : label
}

function isDirectiveLabelParagraph(node: MdxContent): node is Paragraph {
  if (node.type !== "paragraph") return false
  const data = (node as Paragraph).data as { directiveLabel?: boolean } | undefined
  return data?.directiveLabel === true
}

function textFromNode(node: MdxContent): string {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map(textFromNode).join("")
  }

  return ""
}
