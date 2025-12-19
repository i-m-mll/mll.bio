/**
 * CV/Resume data configuration
 *
 * Sections will only appear on the About page if they contain data.
 * To hide a section, simply empty its array or set it to undefined.
 *
 * Edit this file to update your CV - no need to touch the About page component.
 */

export interface Experience {
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string // undefined = "Present"
  description?: string
  highlights?: string[]
}

export interface Education {
  degree: string
  field: string
  institution: string
  location?: string
  year: string
  description?: string
}

export interface Skill {
  category: string
  items: string[]
}

export interface Publication {
  title: string
  venue?: string
  year: string
  url?: string
  authors?: string
}

export interface Award {
  title: string
  issuer: string
  year: string
  description?: string
}

export interface CVData {
  // Summary/bio shown at top of About page
  bio?: string

  // Work experience
  experience?: Experience[]

  // Education
  education?: Education[]

  // Skills grouped by category
  skills?: Skill[]

  // Publications
  publications?: Publication[]

  // Awards and honors
  awards?: Award[]

  // Personal interests (shown as prose paragraph)
  interests?: string
}

/**
 * Your CV data - edit this to update your About page
 */
export const cvData: CVData = {
  // Uncomment and fill in sections as needed

  // bio: "I am a researcher and developer...",

  // experience: [
  //   {
  //     title: "Senior Researcher",
  //     company: "University Lab",
  //     location: "City, Country",
  //     startDate: "2020",
  //     endDate: undefined, // Present
  //     description: "Leading research on...",
  //     highlights: [
  //       "Published X papers",
  //       "Developed Y system",
  //     ],
  //   },
  // ],

  // education: [
  //   {
  //     degree: "PhD",
  //     field: "Computer Science",
  //     institution: "University Name",
  //     year: "2020",
  //   },
  // ],

  // skills: [
  //   {
  //     category: "Programming",
  //     items: ["Python", "TypeScript", "JAX"],
  //   },
  //   {
  //     category: "Research",
  //     items: ["Machine Learning", "Neuroscience"],
  //   },
  // ],

  // publications: [
  //   {
  //     title: "Paper Title",
  //     venue: "Conference/Journal",
  //     year: "2023",
  //     url: "https://...",
  //     authors: "Author A, Author B, You",
  //   },
  // ],

  // awards: [
  //   {
  //     title: "Best Paper Award",
  //     issuer: "Conference Name",
  //     year: "2023",
  //   },
  // ],

  // interests: "Outside of work, I enjoy hiking, reading science fiction, and playing chess.",
}
