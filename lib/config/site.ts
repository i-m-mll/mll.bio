export const siteConfig = {
  name: "MLL",
  // Full name shown on homepage (animates to 'name' on other pages)
  fullName: "MLL",
  description: "Personal website and blog",
  url: "https://mll.bio",
  author: "MLL",

  // Newsletter/subscription settings
  newsletter: {
    // Buttondown username (set to empty string to disable)
    buttondownUsername: "mll",
  },

  // Toggle pages on/off
  pages: {
    blog: true,
    verse: true,
    // Set to false to incorporate About content into homepage instead
    about: false,
  },

  // Homepage configuration
  homepage: {
    // Ordered list of sections to display on the homepage
    // Available sections: "intro", "social-links", "what-i-do", "projects",
    //                     "background", "go-ahead", "subscribe", "recent-posts"
    // "projects" shows the projects list from lib/config/projects.ts
    // "background" is typically omitted when about is on homepage (to avoid redundancy)
    sections: [
      "intro",
      "social-links",
      "what-i-do",
      "projects",
      // "background", // Uncomment if about page is separate
      "go-ahead",
      "subscribe",
      "recent-posts",
    ] as const,
  },

  // Header navigation options
  header: {
    // Show explicit "Home" link in nav (if false, users click site name to go home)
    showHomeLink: false,
    // Animate between fullName (homepage) and name (other pages)
    animateName: true,
    // Animation style: "fade" (letters fade out), "slide" (letters slide away)
    animationStyle: "fade" as "fade" | "slide",
    // Animation duration in milliseconds
    animationDuration: 400,
    // Viewport width (px) below which the name collapses to initials even on homepage
    collapseNameWidth: 650,
    // Right-align nav links (recommended when animateName is true)
    navAlignRight: true,
    // Collapse search to icon (expands on click)
    collapsibleSearch: true,
    // If true, search collapses on click-away even when there's content entered
    // If false, search only collapses on click-away when empty
    collapseSearchOnClickAway: false,
  },

  // Social links
  social: {
    email: "mll@mll.bio",
    discord: "https://discord.gg/robustenough",
    github: "https://github.com/i-m-mll",
    manifold: "https://manifold.markets/MLL",
    X: "https://twitter.com/robustenough",
    bluesky: "https://bsky.app/profile/robustenough",
    mastodon: "https://mastodon.social/@robustenough",
    linkedin: "https://linkedin.com/in/mll",
  },

  // Comments configuration
  comments: {
    // Set to 'giscus' to enable, or false to disable
    provider: false as 'giscus' | false,

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
// These should match the values in tailwind.config.ts
export const breakpoints = {
  // When sidenotes become footnotes (matches 'desktop' in tailwind)
  desktop: 1051,
  // When TOC becomes mobile (matches 'tablet' in tailwind)
  mobile: 701,
} as const 