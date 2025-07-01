### Site-wide search – current feature set (implemented)

1. **Configurable toggles & styling**  
   • `uiConfig.search.enabled` switches the whole feature on/off.  
   • Further knobs in `uiConfig.search`:  
     – `dropdownMaxWidthRem` – cap dropdown width.  
     – `snippetLinesParagraph`, `snippetLinesCode` – clamp snippet length.  
     – `maxSnippetsPerResult` – limit number of snippets generated per hit (-1 / null ⇒ unlimited).

2. **Header integration**  
   • Compact search bar lives in the site header, hidden and tree-shaken when search is disabled.

3. **Keyboard & mouse interaction**  
   • Up/Down choose a result, Enter opens it.  
   • Mouse clicks work identically.  
   • Navigation uses `router.push(url, {scroll:false})` / `<Link scroll={false}>` so client-side scrolling is never overridden by Next.js.

4. **Live, prefix-tolerant search**  
   • Each token is issued to Lunr twice:  
     – as `token*` (trailing wildcard) for fuzzy prefix matches,  
     – as `stem(token)` (no wildcard) for full-word matches that would otherwise be lost to stemming.  
   • Results update in real time as the user types.

5. **Build-time, block-level index**  
   • `scripts/generate-search-index.mjs` runs in `predev/prebuild`.  
   • Every paragraph, heading, list item, blockquote and **entire** code block becomes a Lunr document.  
   • For code blocks the full text is indexed, while only the first `snippetLinesCode` lines are kept as the stored preview.  
   • The public index ships as `/public/search/index.json`, containing `{ index, store }`.

6. **Result generation & de-duplication**  
   • Each hit’s match positions are mapped back to snippets on the client.  
   • For code blocks snippets start at the first matching line; further matches that fall inside the same window are skipped, preventing duplicate/overlapping previews.  
   • Duplicate snippets across different match positions collapse into one dropdown entry.

7. **Precise navigation to snippet**  
   • Internal Lunr documents are keyed `slug::blockIdx`.  
   • That `blockIdx` is appended as `&b=` in result URLs.  
   • `SearchHighlighter` waits for content to paint, highlights all matches, then  
     – scrolls to the first `<mark>` inside the referenced block if `b` is present,  
     – otherwise scrolls to the very first match in the article.  
   • Automatic scrolling performed by the router is disabled to avoid races.

8. **In-page highlighting**  
   • All occurrences of every query token are wrapped in `<mark data-search-highlight>`.  
   • Highlights are removed and rebuilt on each navigation, preventing accumulation.

### TODO / outstanding items

1. **Reliable centred scrolling** – some cases still overshoot (especially inside long code blocks or when the element’s height exceeds the viewport). Improve `scrollToCenter` to account for tall targets and sticky header height dynamically.

2. **Optional deep anchors** – consider assigning permanent IDs to every block during MDX compilation so links can use real fragment identifiers (`#block-17`) instead of the ephemeral `&b=` query parameter.

3. **Visual polish**  
   • Tweak dropdown hover/active states.  
   • Consider showing the post date or reading-time meta beside each result.

4. **Accessibility**  
   • ARIA roles and live-region announcements for updated result lists.  
   • Ensure high contrast for highlight colours in both light & dark modes.

5. **Internationalisation**  
   • Replace Lunr’s hard-coded English pipeline when non-English content is added.
