import assert from "node:assert/strict"
import test from "node:test"

import { escapeHtml, sanitizeHtml } from "../lib/html-sanitizer.mjs"
import { renderInlineMarkdown } from "../lib/utils"
import { remarkDirectivesToJsx } from "../lib/remark-directives-to-jsx"

test("renderInlineMarkdown escapes raw HTML and rejects unsafe links", () => {
  const rendered = renderInlineMarkdown(
    '<img src=x onerror=alert(1)> **ok** [bad](javascript:alert(1)) [safe](/ok?x=1&y=2)'
  )

  assert.match(rendered, /&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.match(rendered, /<strong>ok<\/strong>/)
  assert.match(rendered, /bad/)
  assert.doesNotMatch(rendered, /javascript:/)
  assert.match(rendered, /<a href="\/ok\?x=1&amp;y=2" class="underline hover:opacity-80">safe<\/a>/)
})

test("sanitizeHtml removes raw scripts, event handlers, and unsafe hrefs", () => {
  const rendered = sanitizeHtml(
    '<p onclick="alert(1)">Hi <script>alert(2)</script><a href="javascript:alert(3)" onmouseover="alert(4)">bad</a><a href="https://example.com?q=1&x=2">ok</a></p>'
  )

  assert.equal(
    rendered,
    '<p>Hi <a>bad</a><a href="https://example.com?q=1&amp;x=2">ok</a></p>'
  )
})

test("sanitizeHtml is safe to run more than once", () => {
  const once = sanitizeHtml('<p>AT&T &lt;safe&gt; <code>x < y</code></p>')
  const twice = sanitizeHtml(once)

  assert.equal(once, '<p>AT&amp;T &lt;safe&gt; <code>x &lt; y</code></p>')
  assert.equal(twice, once)
})

test("escapeHtml handles attribute-sensitive characters", () => {
  assert.equal(escapeHtml(`"quoted" 'single' <tag> & raw`), "&quot;quoted&quot; &#39;single&#39; &lt;tag&gt; &amp; raw")
})

test("known directives preserve boolean attrs and extract labels without shifting original children", () => {
  const directive = {
    type: "containerDirective",
    name: "info-callout",
    attributes: {
      flag: null,
      skipped: undefined,
    },
    children: [
      {
        type: "paragraph",
        data: { directiveLabel: true },
        children: [{ type: "text", value: "Important" }],
      },
      {
        type: "paragraph",
        children: [{ type: "text", value: "Body" }],
      },
    ],
  }
  const originalChildren = directive.children
  const tree = { type: "root", children: [directive] }

  runDirectiveTransform(tree)

  const transformed = tree.children[0] as any
  assert.equal(transformed.type, "mdxJsxFlowElement")
  assert.equal(transformed.name, "InfoCallout")
  assert.deepEqual(transformed.attributes, [
    { type: "mdxJsxAttribute", name: "flag", value: null },
    { type: "mdxJsxAttribute", name: "title", value: "Important" },
  ])
  assert.equal(transformed.children.length, 1)
  assert.equal(originalChildren.length, 2)
})

test("unknown directives produce diagnostics and visible development placeholders", () => {
  const tree = {
    type: "root",
    children: [
      {
        type: "textDirective",
        name: "tpyo",
        attributes: {},
        children: [{ type: "text", value: "Body" }],
        position: { start: { line: 2, column: 3 } },
      },
    ],
  }

  const { messages, warnings } = runDirectiveTransform(tree)
  const transformed = tree.children[0] as any

  assert.equal(transformed.type, "mdxJsxTextElement")
  assert.equal(transformed.name, "span")
  assert.deepEqual(transformed.attributes, [
    { type: "mdxJsxAttribute", name: "data-unknown-directive", value: "tpyo" },
  ])
  assert.equal(transformed.children[0].value, "Unknown directive: tpyo")
  assert.match(messages[0].reason, /Unknown markdown directive "tpyo" in content\/post.md:2:3/)
  assert.match(warnings[0], /Unknown markdown directive "tpyo"/)
})

function runDirectiveTransform(tree: any) {
  const messages: Array<{ reason: string; ruleId: string }> = []
  const warnings: string[] = []
  const originalWarn = console.warn
  const originalEnv = process.env.NODE_ENV

  console.warn = (message?: unknown) => {
    warnings.push(String(message))
  }
  ;(process.env as any).NODE_ENV = "development"

  try {
    const transformer = (remarkDirectivesToJsx as any)()
    transformer(tree, {
      path: "content/post.md",
      message(reason: string, _place: unknown, ruleId: string) {
        messages.push({ reason, ruleId })
      },
    })
  } finally {
    console.warn = originalWarn
    ;(process.env as any).NODE_ENV = originalEnv
  }

  return { messages, warnings }
}
