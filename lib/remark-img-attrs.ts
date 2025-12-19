import { visit } from "unist-util-visit"
import type { Plugin } from "unified"

/**
 * remark plugin to extract attribute list from the optional image title string.
 * Markdown syntax:
 *   ![Alt](./path.jpg "width=50% class=rounded-lg")
 * The string after the URL (between quotes) is normally the HTML title attribute.
 * We intercept it, parse key=value pairs, attach them to the node, and then
 * remove the title so it isn't rendered.
 *
 * Parsed attributes are assigned as properties on the image node so MDX passes
 * them through as props.
 */
export const remarkImgAttrs: Plugin = () => (tree: any) => {
  visit(tree, "image", (node: any) => {
    if (typeof node.title !== "string" || node.title.trim() === "") return
    const attrString = node.title.trim()

    // Remove title so it doesn't become HTML title="..."
    node.title = null

    const hProps: Record<string, unknown> = {}
    attrString.split(/\s+/).forEach((pair: string) => {
      const [key, rawVal] = pair.split("=")
      if (!key) return
      const val = rawVal?.replace(/^"|"$/g, "")
      if (val === undefined) return
      if ((key === "width" || key === "height") && val.endsWith("%")) {
        const styleVal = `${key}: ${val};`
        hProps.style = hProps.style ? `${hProps.style}; ${styleVal}` : styleVal
      } else {
        hProps[key] = /^[0-9]+$/.test(val) ? Number(val) : val
      }
    })
    if (hProps.style && /(width|height)/.test(String(hProps.style))) {
      const s = String(hProps.style)
      const hasDisplay = /display:/.test(s)
      const hasMargins = /margin(-left|-right)?:/.test(s)
      let extra = ""
      if (!hasDisplay) extra += "display:block;"
      if (!hasMargins) extra += "margin-left:auto;margin-right:auto;"
      hProps.style = `${extra} ${s}`.trim()
    }
    if (!node.data) node.data = {}
    node.data.hProperties = { ...(node.data.hProperties || {}), ...hProps }
  })
}
