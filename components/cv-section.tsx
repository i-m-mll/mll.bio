import { cvData } from "@/lib/config/cv"
import type { CVData, Experience, Education, Skill, Publication, Award } from "@/lib/config/cv"

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-tight mb-4 font-heading">
      {children}
    </h2>
  )
}

function ExperienceItem({ item }: { item: Experience }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <h3 className="font-semibold">{item.title}</h3>
        <span className="text-sm text-muted-foreground">
          {item.startDate} – {item.endDate || "Present"}
        </span>
      </div>
      <div className="text-muted-foreground">
        {item.company}
        {item.location && <span> · {item.location}</span>}
      </div>
      {item.description && (
        <p className="mt-2 text-sm">{item.description}</p>
      )}
      {item.highlights && item.highlights.length > 0 && (
        <ul className="mt-2 text-sm list-disc list-inside text-muted-foreground">
          {item.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EducationItem({ item }: { item: Education }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <h3 className="font-semibold">
          {item.degree} in {item.field}
        </h3>
        <span className="text-sm text-muted-foreground">{item.year}</span>
      </div>
      <div className="text-muted-foreground">
        {item.institution}
        {item.location && <span> · {item.location}</span>}
      </div>
      {item.description && (
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
      )}
    </div>
  )
}

function SkillsSection({ skills }: { skills: Skill[] }) {
  return (
    <div className="space-y-2">
      {skills.map((skill, i) => (
        <div key={i}>
          <span className="font-medium">{skill.category}:</span>{" "}
          <span className="text-muted-foreground">{skill.items.join(", ")}</span>
        </div>
      ))}
    </div>
  )
}

function PublicationItem({ item }: { item: Publication }) {
  return (
    <div className="mb-3 last:mb-0">
      {item.url ? (
        <a href={item.url} className="font-medium hover:underline" target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      ) : (
        <span className="font-medium">{item.title}</span>
      )}
      {item.venue && <span className="text-muted-foreground"> · {item.venue}</span>}
      <span className="text-muted-foreground"> ({item.year})</span>
      {item.authors && (
        <div className="text-sm text-muted-foreground">{item.authors}</div>
      )}
    </div>
  )
}

function AwardItem({ item }: { item: Award }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <span className="font-medium">{item.title}</span>
        <span className="text-sm text-muted-foreground">{item.year}</span>
      </div>
      <div className="text-muted-foreground">{item.issuer}</div>
      {item.description && (
        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
      )}
    </div>
  )
}

export function CVSection() {
  const { bio, experience, education, skills, publications, awards, interests } = cvData

  // Check if there's any CV content to show
  const hasContent =
    bio ||
    (experience && experience.length > 0) ||
    (education && education.length > 0) ||
    (skills && skills.length > 0) ||
    (publications && publications.length > 0) ||
    (awards && awards.length > 0) ||
    interests

  if (!hasContent) {
    return null
  }

  return (
    <div className="space-y-8">
      {bio && (
        <section>
          <p className="text-lg">{bio}</p>
        </section>
      )}

      {experience && experience.length > 0 && (
        <section>
          <SectionHeading>Experience</SectionHeading>
          {experience.map((item, i) => (
            <ExperienceItem key={i} item={item} />
          ))}
        </section>
      )}

      {education && education.length > 0 && (
        <section>
          <SectionHeading>Education</SectionHeading>
          {education.map((item, i) => (
            <EducationItem key={i} item={item} />
          ))}
        </section>
      )}

      {skills && skills.length > 0 && (
        <section>
          <SectionHeading>Skills</SectionHeading>
          <SkillsSection skills={skills} />
        </section>
      )}

      {publications && publications.length > 0 && (
        <section>
          <SectionHeading>Publications</SectionHeading>
          {publications.map((item, i) => (
            <PublicationItem key={i} item={item} />
          ))}
        </section>
      )}

      {awards && awards.length > 0 && (
        <section>
          <SectionHeading>Awards & Honors</SectionHeading>
          {awards.map((item, i) => (
            <AwardItem key={i} item={item} />
          ))}
        </section>
      )}

      {interests && (
        <section>
          <SectionHeading>Interests</SectionHeading>
          <p className="text-muted-foreground">{interests}</p>
        </section>
      )}
    </div>
  )
}
