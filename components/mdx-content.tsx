// Server Component: compiles MDX at build time
import { compile, run } from "@mdx-js/mdx"
import * as runtime from "react/jsx-runtime"

import { Callout } from "@/components/callout"
import { Sidenote, MarginNote } from "@/components/sidenote"
import { NoteScope } from "@/components/note-anchor"
import { TableOfContents } from "@/components/table-of-contents"
import ResponsiveImage from "@/components/ResponsiveImage"
import { SidenoteProvider } from "@/components/sidenote-context"

import { remarkSidenotes } from "@/lib/remark-sidenotes"
import { rehypeHeadingIds } from "@/lib/rehype-heading-ids"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import { remarkImgAttrs } from "@/lib/remark-img-attrs"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

// Map of components that MDX can render (these have their own "use client" if needed)
const mdxComponents = {
  Callout,
  Sidenote,
  MarginNote,
  NoteScope,
  TableOfContents,
  img: (props: any) => <ResponsiveImage {...props} />,
}

interface MDXContentProps {
  children: string // raw MDX source
}

// Server Component: pre-compiles MDX during build/static generation
export async function MDXContent({ children }: MDXContentProps) {
  const compiled = await compile(children, {
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
      rehypeKatex,
    ],
  })

  const { default: Content } = await run(compiled, {
    ...runtime,
    baseUrl: import.meta.url,
  })

  return (
    <SidenoteProvider>
      <Content components={mdxComponents} />
    </SidenoteProvider>
  )
}
