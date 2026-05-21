// Server Component: compiles MDX at build time
import { compile, run } from "@mdx-js/mdx"
import React from "react"
import * as runtime from "react/jsx-runtime"

import { Sidenote, MarginNote } from "@/components/sidenote"
import { NoteScope } from "@/components/note-anchor"
import { TableOfContents } from "@/components/table-of-contents"
import { PostImage } from "@/components/post-image"
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
import { SpotifyEmbed, YouTubeEmbed } from "@/components/media-embed"

import { remarkSidenotes } from "@/lib/remark-sidenotes"
import { remarkDirectivesToJsx } from "@/lib/remark-directives-to-jsx"
import { rehypeHeadingIds } from "@/lib/rehype-heading-ids"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import { remarkImgAttrs } from "@/lib/remark-img-attrs"
import remarkMath from "remark-math"
import remarkDirective from "remark-directive"
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
  "\\compo": "\\mathrel{\\text{⨾}}",   // U+2A3E z notation relational composition
  // Arrow variants
  "\\mapsfrom": "\\mathrel{\\text{↤}}",  // U+21A4 leftwards from bar
  "\\klarrow": "\\mathrel{\\text{⇴}}",   // U+21F4 right arrow with small circle
  // Other symbols
  "\\weaken": "\\text{ꟽ}",               // U+A7FD latin epigraphic letter inverted m
  "\\marg": "\\mathsf{M}",
  "\\valid": "\\parallel",
  "\\ccomp": "\\mathrel{\\tiny{\\odot}\\normalsize}",
  "\\pcomp": "\\mathrel{\\otimes}",
  "\\condindep": "\\perp\\!\\!\\!\\!\\!\\!\\perp",
  "\\conddep": "\\top\\!\\!\\!\\!\\!\\!\\top",
  // Accent colors (Okabe-Ito palette, matching diagram rendering pipeline)
  "\\cA": "\\color{#0173b2}",   // blue
  "\\cB": "\\color{#de8f05}",   // orange
  "\\cC": "\\color{#029e73}",   // green
  "\\cD": "\\color{#d55e00}",   // vermillion
  "\\cE": "\\color{#cc78bc}",   // pink
  "\\cF": "\\color{#ca9161}",   // brown
  "\\cG": "\\color{#fbafe4}",   // light pink
  "\\cH": "\\color{#949494}",   // gray
  "\\cI": "\\color{#ece133}",   // yellow
  "\\cJ": "\\color{#56b4e9}",   // light blue
  "\\cZ": "\\color{black}",     // reset
}

// Map of components that MDX can render (these have their own "use client" if needed)
const mdxComponents = {
  Sidenote,
  MarginNote,
  NoteScope,
  TableOfContents,
  code: Code,
  img: (props: any) => <PostImage {...props} />,
  hr: () => <div role="separator" className="hr-separator" />,
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
  // Media embeds
  SpotifyEmbed,
  YouTubeEmbed,
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

function Code({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"code">) {
  return <code {...props}>{normalizeCodeChildren(children, "code-child")}</code>
}

function normalizeCodeChildren(
  children: React.ReactNode,
  keyPrefix: string
): React.ReactNode {
  return React.Children.toArray(children).map((child, index) =>
    normalizeCodeChild(child, `${keyPrefix}-${index}`)
  )
}

function normalizeCodeChild(
  child: React.ReactNode,
  key: string
): React.ReactNode {
  if (!React.isValidElement<{ children?: React.ReactNode }>(child)) {
    return <React.Fragment key={key}>{child}</React.Fragment>
  }

  const props =
    child.props.children === undefined
      ? { key }
      : {
          key,
          children: normalizeCodeChildren(child.props.children, key),
        }

  return React.cloneElement(child, props)
}

interface MDXContentProps {
  children: string // raw MDX source
  comparisonContent?: string // Old content to diff against (for diff mode)
  enableSidenotes?: boolean // When false, skip sidenote conversion (default: true)
}

// Server Component: pre-compiles MDX during build/static generation
export async function MDXContent({ children, comparisonContent, enableSidenotes = true }: MDXContentProps) {
  // If comparison content is provided, construct diff-marked MDX
  const sourceToRender = comparisonContent
    ? constructDiffMdx(comparisonContent, children)
    : children

  const compiled = await compile(sourceToRender, {
    outputFormat: "function-body",
    remarkPlugins: [
      [remarkGfm, { singleTilde: false }],
      remarkMath,
      remarkDirective,
      remarkDirectivesToJsx,
      ...(enableSidenotes ? [remarkSidenotes] : []),
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
