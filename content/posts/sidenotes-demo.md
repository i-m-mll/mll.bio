---
title: "Sidenotes and Margin Notes Demo"
date: "2024-01-15"
description: "Demonstrating both Tufte-style sidenotes and margin notes"
---

This post demonstrates how to use both Tufte-style sidenotes[^1] and margin notes[!margin: Margin notes are unnumbered and appear without any superscript in the main text.] in your blog posts. 

Sidenotes use standard footnote syntax and are numbered sequentially[^2], while margin notes use a different syntax and appear without numbers[!margin: They're perfect for brief clarifications that don't need explicit referencing.].

## About Tufte-Style Sidenotes

Edward Tufte's approach to sidenotes[^3] prioritizes keeping supplementary information close to the relevant text, rather than forcing readers to jump to the bottom of the page.

The implementation follows the principles outlined in Tufte CSS[^4], providing an elegant reading experience that doesn't interrupt the flow of the main text.

## Margin Notes vs Sidenotes

Margin notes are different from sidenotes in several ways[!margin: Notice how this margin note doesn't interrupt the numbering sequence of the sidenotes.]:

- **Sidenotes**: Numbered, referenced with superscript numbers in the text
- **Margin notes**: Unnumbered, inserted inline without visible markers

Both types of notes appear in the right margin[^5] and help maintain reading flow without disrupting the main text.

## Responsive Design

On mobile devices, both sidenotes and margin notes become toggleable - tap the sidenote number to show or hide the note content.

## How to Use

**For sidenotes**, use standard Markdown footnote syntax:
- `[^1]` for the reference in your text
- `[^1]: Your sidenote content` for the definition

**For margin notes**, use the inline syntax:
- `[!margin: Your margin note content]` placed directly in the text

[!margin: This margin note demonstrates the inline syntax - it appears exactly where it's placed in the markdown.]

[^1]: This is your first sidenote! It appears in the right margin with a number that corresponds to the superscript in the text.

[^2]: Here's the second numbered sidenote, showing how they maintain sequential numbering.

[^3]: Edward Tufte is known for his work on information design and data visualization. His books demonstrate elegant typography and layout principles.

[^4]: Tufte CSS is a set of stylesheets inspired by the handouts of Edward Tufte, available at https://edwardtufte.github.io/tufte-css/

[^5]: The right margin provides space for both types of notes, with appropriate spacing between them. 