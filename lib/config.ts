export const siteConfig = {
  name: "MLL",
  description: "Personal website and blog",
  url: "https://mll.bio",
  author: "MLL",

  // Toggle pages on/off
  pages: {
    blog: true,
    about: true,
  },

  // Social links
  social: {
    github: "https://github.com/yourusername",
    twitter: "https://twitter.com/yourusername",
    linkedin: "https://linkedin.com/in/yourusername",
    email: "your.email@example.com",
  },

  // Comments configuration
  comments: {
    // Set to 'giscus' to enable, or false to disable
    provider: false,

    // Giscus configuration
    giscus: {
      // Your GitHub username/repo where discussions are hosted
      repo: "yourusername/your-repo-name",
      // Repository ID (get this from Giscus setup)
      repoId: "R_kgDOXXXXXX",
      // Discussion category name
      category: "Comments",
      // Category ID (get this from Giscus setup)
      categoryId: "DIC_kwDOXXXXXX",
      // Mapping between page and discussion (pathname, url, title, og:title)
      mapping: "pathname",
      // Enable reactions
      reactionsEnabled: true,
      // Emit discussion metadata
      emitMetadata: false,
      // Position of the input box (top or bottom)
      inputPosition: "bottom",
      // Language
      lang: "en",
    },
  },
}

// Responsive breakpoints configuration
export const breakpoints = {
  // When sidenotes become footnotes
  desktop: 1200,
  // When TOC becomes mobile
  mobile: 700,
} as const 