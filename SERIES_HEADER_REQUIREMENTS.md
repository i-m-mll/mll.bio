# Series Header Requirements

## Layout Structure

The page has a 3-column grid on desktop:
- Column 1: TOC (250px)
- Column 2: Post content (1fr)
- Column 3: Sidenotes (18vw)

## Series Header Position

The series header should:
1. Be positioned **to the right of the TOC** (in columns 2-3 area)
2. Be **vertically at the top** - directly below the main site header
3. Have **compact height** - only as tall as its content (not stretching to match TOC height, and in fact should not be conditionally tied to the table of Contents height in any way)

## Series Header Border

The bottom border should:
1. Start at the **right edge of the TOC** (where the TOC's right border/line is)
2. Extend all the way to the **right edge of the page**

## Series Header Content Alignment

The navigation content (← Prev | Part X of Series | Next →) should:
1. Be aligned with the **post body width** (the prose content width)
2. NOT be centered in the entire right portion of the page
3. The "←" should align with the left edge of paragraphs
4. The "→" should align with the right edge of paragraphs
5. "Part X of Series" should be centered between them

## Animation Behavior

Two configurable modes in `uiConfig.series.header.animationMode`:

### Mode: 'fade' (default)
- When hiding: Series header fades out FIRST, then main header slides up
- When showing: Main header slides down FIRST, then series header fades in
- Sequential, not simultaneous

### Mode: 'complex'
- Both headers move together as one unit

## Other Requirements

1. No extra whitespace between series header and post content below
2. Series header should show/hide based on scroll direction (configurable via `stickyMode`)
3. On mobile: series header spans full width
