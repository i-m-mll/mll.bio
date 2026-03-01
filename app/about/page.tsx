import { notFound } from "next/navigation"
import { siteConfig } from "@/lib/config/site"
import { getProjects } from "@/lib/projects"
import { ProjectList } from "@/components/project-card"
import { CVSection } from "@/components/cv-section"

export const metadata = {
  title: "About",
  description: "About me and my work",
}

export default async function AboutPage() {
  // Check if about page is enabled in config
  if (!siteConfig.pages.about) {
    notFound()
  }

  const projects = await getProjects()

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-8 font-heading">About</h1>

      {/* Projects Section - prominently at top */}
      {projects.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold tracking-tight mb-4 font-heading">Projects</h2>
          <ProjectList projects={projects} />
        </section>
      )}

      {/* CV Section - data-driven from lib/config/cv.ts */}
      <CVSection />
    </div>
  )
}
