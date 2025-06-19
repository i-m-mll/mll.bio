"use client"

import { compile, run } from "@mdx-js/mdx"
import { useEffect, useState } from "react"
import * as runtime from "react/jsx-runtime"
import * as devRuntime from "react/jsx-dev-runtime"
import { Callout } from "@/components/callout"
import { Sidenote, MarginNote } from "@/components/sidenote"
import { NoteAnchor } from "@/components/note-anchor"
import { TableOfContents } from "@/components/table-of-contents"
import { SidenoteProvider, useSidenoteNumber } from "@/components/sidenote-context"
import { remarkSidenotes } from "@/lib/remark-sidenotes"
import { rehypeHeadingIds } from "@/lib/rehype-heading-ids"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

const components = {
  Callout,
  Sidenote,
  MarginNote,
  NoteAnchor,
  TableOfContents,
}

function MDXRenderer({ children }: { children: string }) {
  const [MdxComponent, setMdxComponent] = useState<React.ComponentType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { resetCounter } = useSidenoteNumber()

  useEffect(() => {
    // Reset sidenote counter for each new page
    resetCounter()

    const compileMDX = async () => {
      try {
        const compiled = await compile(children, {
          outputFormat: "function-body",
          development: process.env.NODE_ENV === "development",
          remarkPlugins: [
            [remarkGfm, { singleTilde: false }],
            remarkMath,
            remarkSidenotes
          ],
          rehypePlugins: [
            rehypeHeadingIds,
            [rehypeHighlight, { 
              theme: {
                light: 'github-light',
                dark: 'github-dark',
              },
              ignoreMissing: true 
            }],
            rehypeKatex
          ],
        })
        
        const { default: Component } = await run(compiled, {
          ...runtime,
          ...devRuntime,
          baseUrl: import.meta.url,
        })
        
        setMdxComponent(() => (props: any) => <Component components={components} {...props} />)
      } catch (error) {
        console.error("Error compiling MDX:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (children) {
      compileMDX()
    } else {
      setIsLoading(false)
    }
  }, [children, resetCounter])

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (!MdxComponent) {
    return <div className="text-red-500">Error loading content</div>
  }

  return <MdxComponent />
}

export function MDXContent({ children }: { children: string }) {
  return (
    <SidenoteProvider>
      <MDXRenderer>{children}</MDXRenderer>
    </SidenoteProvider>
  )
}
