export const siteConfig = {
  name: "Your Name",
  description: "Personal website and blog",
  url: "https://yourwebsite.com",
  author: "Your Name",

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
    provider: "giscus",

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
