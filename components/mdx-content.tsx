// Server Component: compiles MDX at build time
import { compile, run } from "@mdx-js/mdx"
import * as runtime from "react/jsx-runtime"

import { Sidenote, MarginNote } from "@/components/sidenote"
import { NoteScope } from "@/components/note-anchor"
import { TableOfContents } from "@/components/table-of-contents"
import { MdxImage } from "@/components/mdx-image"
import { SidenoteProvider } from "@/components/sidenote-context"
import { KatexStyles } from "@/components/KatexStyles"
import { Tabs, Tab } from "@/components/tabs"
import {
  CollapsibleCallout,
  InfoCallout,
  NotationCallout,
  StringDiagramCallout,
  CaptionCallout,
} from "@/components/collapsible-callout"
import { Figure } from "@/components/figure"

import { remarkSidenotes } from "@/lib/remark-sidenotes"
import { rehypeHeadingIds } from "@/lib/rehype-heading-ids"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import { remarkImgAttrs } from "@/lib/remark-img-attrs"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeCallouts from "rehype-callouts"
import { DiffAdd, DiffDel, DiffAddBlock, DiffDelBlock } from "@/components/diff-markers"
import ChatLog from "@/components/chat-log"
import ChatMessage from "@/components/chat-message"
import ThinkingBlock from "@/components/thinking-block"
import { ToolUse } from "@/components/tool-use-block"
import { constructDiffMdx } from "@/lib/construct-diff-mdx"

// Global KaTeX macros for probability theory series and general use
const katexMacros: Record<string, string> = {
  // Function composition in intuitive order (f then g, not g∘f)
  "\\comp": "\\mathrel{\\circ}",
  "\\compo": "\\mathrel{\\unicode{x2A3E}}",
  // Arrow variants
  "\\mapsfrom": "\\mathrel{\\unicode{x21a4}}",
  "\\klarrow": "\\mathrel{\\unicode{x21F4}}",
  // Other symbols
  "\\weaken": "\\unicode{xA7FD}",
  "\\marg": "\\mathsf{M}",
  "\\valid": "\\parallel",
  "\\ccomp": "\\mathrel{\\tiny{\\odot}\\normalsize}",
  "\\pcomp": "\\mathrel{\\otimes}",
  "\\condindep": "\\perp\\!\\!\\!\\!\\!\\!\\perp",
  "\\conddep": "\\top\\!\\!\\!\\!\\!\\!\\top",
}

// Map of components that MDX can render (these have their own "use client" if needed)
const mdxComponents = {
  Sidenote,
  MarginNote,
  NoteScope,
  TableOfContents,
  img: (props: any) => <MdxImage {...props} />,
  Tab,
  Tabs,
  // Collapsible callout components for series posts
  CollapsibleCallout,
  InfoCallout,
  NotationCallout,
  StringDiagramCallout,
  CaptionCallout,
  // Figure with margin-aligned caption
  Figure,
  // Diff marker components
  DiffAdd,
  DiffDel,
  DiffAddBlock,
  DiffDelBlock,
  // Chat log components
  ChatLog,
  ChatMessage,
  ThinkingBlock,
  ToolUse,
}

interface MDXContentProps {
  children: string // raw MDX source
  comparisonContent?: string // Old content to diff against (for diff mode)
}

// Server Component: pre-compiles MDX during build/static generation
export async function MDXContent({ children, comparisonContent }: MDXContentProps) {
  // If comparison content is provided, construct diff-marked MDX
  const sourceToRender = comparisonContent
    ? constructDiffMdx(comparisonContent, children)
    : children

  const compiled = await compile(sourceToRender, {
    outputFormat: "function-body",
    remarkPlugins: [
      [remarkGfm, { singleTilde: false }],
      remarkMath,
      remarkSidenotes,
      remarkImgAttrs,
    ],
    rehypePlugins: [
      rehypeHeadingIds,
      [rehypeHighlight, {
        theme: { light: "github-light", dark: "github-dark" },
        ignoreMissing: true,
      }],
      [rehypeKatex, {
        macros: katexMacros,
        strict: false,
        trust: true,
      }],
      [rehypeCallouts, {
        theme: 'vitepress',
        showIndicator: true,
      }],
    ],
  })

  const { default: Content } = await run(compiled, {
    ...runtime,
    baseUrl: import.meta.url,
  })

  return (
    <>
      {/* Ensure KaTeX CSS is included whenever MDX content is rendered */}
      <KatexStyles />
      <SidenoteProvider>
        <Content components={mdxComponents} />
      </SidenoteProvider>
    </>
  )
}
