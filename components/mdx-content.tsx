"use client"

import { compile, run } from "@mdx-js/mdx"
import { useEffect, useState } from "react"
import * as runtime from "react/jsx-runtime"
import * as devRuntime from "react/jsx-dev-runtime"
import { Callout } from "@/components/callout"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

const components = {
  Callout,
}

export function MDXContent({ children }: { children: string }) {
  const [MdxComponent, setMdxComponent] = useState<React.ComponentType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const compileMDX = async () => {
      try {
        const compiled = await compile(children, {
          outputFormat: "function-body",
          development: process.env.NODE_ENV === "development",
          remarkPlugins: [
            [remarkGfm, { singleTilde: false }],
            remarkMath
          ],
          rehypePlugins: [
            [rehypeHighlight, { ignoreMissing: true }],
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
  }, [children])

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (!MdxComponent) {
    return <div className="text-red-500">Error loading content</div>
  }

  return <MdxComponent />
}
