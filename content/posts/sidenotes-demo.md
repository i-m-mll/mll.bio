---
title: "Sidenotes Demo with Tufte Style"
date: "2024-01-15"
description: "Demonstrating Tufte-style sidenotes using standard footnote syntax"
---

# Sidenotes Demo

This post demonstrates how to use Tufte-style sidenotes[^1] in your blog posts. The sidenotes use standard footnote syntax but are rendered as margin notes instead of appearing at the bottom of the page.

You can have multiple sidenotes in a single paragraph[^2], and they will be positioned appropriately in the right margin on larger screens.

## About Tufte-Style Sidenotes

Edward Tufte's approach to sidenotes[^3] prioritizes keeping supplementary information close to the relevant text, rather than forcing readers to jump to the bottom of the page.

The implementation follows the principles outlined in Tufte CSS[^4], providing an elegant reading experience that doesn't interrupt the flow of the main text.

## Responsive Design

On mobile devices, sidenotes become toggleable - tap the sidenote number to show or hide the note content.

## How to Use

Simply use standard Markdown footnote syntax:
- `[^1]` for the reference in your text
- `[^1]: Your sidenote content` for the definition

[^1]: This is your first sidenote! It appears in the right margin instead of at the bottom of the page.

[^2]: Here's another sidenote with more detailed information that might be useful but not essential to the main text.

[^3]: Edward Tufte is known for his work on information design and data visualization. His books demonstrate elegant typography and layout principles.

[^4]: Tufte CSS is a set of stylesheets inspired by the handouts of Edward Tufte, available at https://edwardtufte.github.io/tufte-css/ 