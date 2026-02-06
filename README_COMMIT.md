# Commit: Add Unclenching series from Substack with full formatting fixes

## Overview
Imports the complete 12-post "Unclenching" series from robustenough.com (Substack) into the site's series system. The HTML-to-markdown conversion required extensive post-processing to fix footnotes, blockquotes, internal links, and images that were mangled during conversion.

## Changes

### Series Content (content/series/unclenching/)
12 markdown posts plus `_series.json` configuration. Posts span Jul 2023 - Oct 2024 covering dynamical systems, predictive coding, Buddhist psychology, and neural annealing.

### Footnote Conversion
Substack's HTML footnotes were converted to bare `[N](url)` references with unstructured text blocks at the bottom. Rebuilt these into standard markdown `[^N]` inline refs + `[^N]: text` definitions with 4-space indented continuation paragraphs. Edge cases handled: `Subscribe[^1]` concatenation, `](url)[^1]` on same line, `1 mm[^3]` misinterpreted as footnote (changed to `1 mm³`).

### Blockquote Fixes
Substack's `<blockquote>` elements were converted to empty `>` markers followed by a blank line and then the quoted text as a regular paragraph. Merged these 60 instances back into proper `> quoted text` format.

### Internal Link Conversion
Converted 78+ Substack URLs (robustenough.substack.com/p/*, open.substack.com/pub/*/p/*, /i/NNN/anchor) to local `/series/unclenching/slug` paths. Stripped leaked selection text from URLs. External Substack links (sashachapin, astralcodexten) left as-is.

### Image Localization
Downloaded 19 images from Substack's S3 CDN to `public/images/unclenching/`. Removed CDN link wrappers. Images named by first 8 chars of UUID. Markdown references use absolute paths (`/images/unclenching/name.ext`) for correct resolution in static export.

### Series Page TOC Fallback
Added conditional rendering: posts with headings get TableOfContents, posts without get StickyTitle sidebar.

## Rationale
Substack's HTML export produces markdown that needs significant cleanup for a proper static site. The fix scripts were designed to be idempotent (safe to re-run) and handle both pre- and post-fix content. Images are served from `public/` with absolute paths because Next.js static export doesn't serve `content/` files, and relative paths resolve against the page URL rather than the markdown file location.

## Files Changed
- `content/series/unclenching/` - 12 post files + _series.json (new)
- `public/images/unclenching/` - 19 downloaded images (new)
- `app/series/[slug]/[post]/page.tsx` - TOC/StickyTitle conditional
- `components/site-header.tsx` - Minor animation fix
- `lib/config/site.ts` - Social links and formatting tweaks
- `public/feed.xml`, `public/search/index.json` - Regenerated
- `generated/image-manifest.json` - Regenerated
