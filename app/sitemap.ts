import { getPosts } from "@/lib/blog"
import { siteConfig } from "@/lib/config/site"

export const dynamic = "force-static"

export default async function sitemap() {
  const posts = siteConfig.pages.blog ? await getPosts() : []

  const postEntries = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.frontmatter.updated || post.frontmatter.published),
  }))

  const routes = ["", "/blog"]
    .filter((route) => {
      if (route === "/blog" && !siteConfig.pages.blog) return false
      return true
    })
    .map((route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date(),
    }))

  if (siteConfig.pages.about) {
    routes.push({
      url: `${siteConfig.url}/about`,
      lastModified: new Date(),
    })
  }

  return [...routes, ...postEntries]
}
