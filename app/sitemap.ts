import { getPosts } from "@/lib/blog"
import { siteConfig } from "@/lib/config/site"
import { getAllSeries } from "@/lib/series"

export const dynamic = "force-static"

export default async function sitemap() {
  const posts = siteConfig.pages.blog ? await getPosts() : []
  const seriesList = siteConfig.pages.blog ? await getAllSeries() : []

  const siteLastModified = getLatestDate([
    ...posts.flatMap((post) => [
      post.frontmatter.updatedRaw,
      post.frontmatter.publishedRaw,
    ]),
    ...seriesList.flatMap((series) => [
      series.updatedRaw,
      series.createdRaw,
      ...series.posts.flatMap((post) => [
        post.frontmatter.updatedRaw,
        post.frontmatter.createdRaw,
      ]),
    ]),
  ])

  const postEntries = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: getFirstDate(post.frontmatter.updatedRaw, post.frontmatter.publishedRaw),
  }))

  const seriesEntries = seriesList.map((series) => ({
    url: `${siteConfig.url}/series/${series.slug}`,
    lastModified: getFirstDate(series.updatedRaw, series.createdRaw),
  }))

  const seriesPostEntries = seriesList.flatMap((series) =>
    series.posts
      .filter((post) => !post.externalUrl)
      .map((post) => ({
        url: `${siteConfig.url}/series/${series.slug}/${post.slug}`,
        lastModified: getFirstDate(post.frontmatter.updatedRaw, post.frontmatter.createdRaw),
      }))
  )

  const routes = ["", "/blog", "/series", "/verse"]
    .filter((route) => {
      if (route === "/blog" && !siteConfig.pages.blog) return false
      if (route === "/series" && !siteConfig.pages.blog) return false
      if (route === "/verse" && !siteConfig.pages.verse) return false
      return true
    })
    .map((route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: siteLastModified,
    }))

  if (siteConfig.pages.about) {
    routes.push({
      url: `${siteConfig.url}/about`,
      lastModified: siteLastModified,
    })
  }

  return [...routes, ...postEntries, ...seriesEntries, ...seriesPostEntries]
}

function getFirstDate(...values: Array<string | undefined>): Date {
  for (const value of values) {
    if (!value) continue
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }

  return new Date()
}

function getLatestDate(values: Array<string | undefined>): Date {
  const timestamps = values
    .flatMap((value) => {
      if (!value) return []
      const timestamp = new Date(value).getTime()
      return Number.isNaN(timestamp) ? [] : [timestamp]
    })

  return timestamps.length ? new Date(Math.max(...timestamps)) : new Date()
}
