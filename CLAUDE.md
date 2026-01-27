# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server (runs predev script first)
- `npm run build` - Build for production (runs prebuild script first)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Pre-build Scripts
- `npm run predev` / `npm run prebuild` - Runs `scripts/build-themes.mjs` to download and prepare syntax highlighting themes
- `npm run dev-fonts` - Generate font variants using `scripts/gen-font-variants.mjs`

### Static Hosting
- `npm run serve` - Build and serve static files on port 3000
- `npm run serve-only` - Serve pre-built static files

## Architecture Overview

This is a **Next.js 15 static site** configured for static export (`output: 'export'`) with a blog and personal website functionality.

### Key Architectural Patterns

**Content Management**: Uses filesystem-based content in `content/posts/` with markdown/MDX files parsed via gray-matter. Blog posts support frontmatter with `title`, `published`, `updated`, `description`, `abstract`, `showtoc`, and `draft` fields.

**Theme System**: Dynamic code syntax highlighting themes downloaded from highlight.js CDN via `scripts/build-themes.mjs`. Themes are configured in `lib/config/code-syntax-themes.ts` and referenced in `lib/config/ui.ts`.

**Typography**: Custom typography system using ET Book as primary font with fallbacks to Inter, Roboto, and Source Serif. Font configuration managed in `lib/fonts.ts` and `lib/config/ui.ts`.

**Sidenotes**: Advanced sidenote system that converts footnotes to margin notes on larger screens. Components include `sidenote.tsx`, `sidenote-context.tsx`, and `sidenote-selection.tsx`.

**Configuration-Driven UI**: Most UI behavior controlled via `lib/config/ui.ts` and `lib/config/site.ts` rather than hardcoded component props.

### Directory Structure

- `app/` - Next.js App Router pages (layout, blog, about)
- `components/` - React components (site header/footer, TOC, sidenotes, theme providers)
- `content/` - Markdown content (posts in `posts/`, pages in `pages/`)
- `lib/` - Utilities and configuration
  - `config/` - Site configuration, UI settings, theme configuration
  - Blog post processing, font management, rehype/remark plugins
- `styles/` - CSS files including generated code themes
- `scripts/` - Build scripts for themes and font variants

### Responsive Design

Uses Tailwind breakpoints defined in `tailwind.config.ts`:
- `tablet: 701px` - Sidenotes become footnotes below this
- `desktop: 1051px` - TOC becomes mobile below this
- Custom breakpoints in `lib/config/site.ts`: desktop (1200px), mobile (700px)

### Development Features

- DevFontSwitcher component (dev mode only) for testing typography
- Hot reload with theme rebuilding on content changes
- Static export optimized for hosting on services like Netlify/Vercel

## Configuration Guidelines

### Tailwind CSS Usage
- Use Tailwind classes instead of custom CSS wherever possible
- Do not hardcode media query dimensions - use viewport dimensions from `tailwind.config.ts`
- Create CSS variables for reused values
- Store UI parameters in `lib/config/ui.ts` rather than component props

### Avoiding Layout Shifts
- When toggling UI elements (checkmarks, icons, indicators), use opacity changes instead of conditional rendering to prevent layout shifts
- Always keep toggled elements in the DOM with consistent dimensions; toggle visibility via `opacity-0`/`opacity-100` classes
- This prevents subtle 1-2px jumps when elements are added/removed from the DOM

### Content Creation
- Add blog posts as `.md` or `.mdx` files in `content/posts/`
- Use proper frontmatter with `published` date (not `date`) 
- Set `draft: true` to hide posts
- Sidenotes use custom markdown syntax processed by `lib/remark-sidenotes.ts`

### Theme Development
- Code syntax themes auto-downloaded from highlight.js CDN
- Configure theme names in `lib/config/code-syntax-themes.ts`
- Run build scripts before dev/build to ensure themes are available

## COMMIT_MSG.txt Usage

Add entries to `COMMIT_MSG.txt` describing high-level changes in present active voice (e.g., "Refactor sidenotes for mobile responsiveness"). Focus on features/goals achieved, not intermediate debugging steps.

## Dev Browser Usage

When reviewing the site with the dev-browser plugin:
- Use `getAISnapshot()` first to check content and page structure (more efficient)
- Only use screenshots when visual verification is needed (design, layout, colors, animations)
- ARIA snapshots are sufficient for verifying text content, element presence, and navigation structure