// Server component: include KaTeX CSS only when used
import 'katex/dist/katex.min.css'

export function KatexStyles() {
  // No runtime work needed: importing CSS in a server component attaches it to
  // the build chunk for pages that render this component.
  return null
}
