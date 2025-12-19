---
title: "Sidenotes and Margin Notes Demo"
date: "2024-01-15"
draft: true
description: "Demonstrating both Tufte-style sidenotes and margin notes"
---

This is a simple test to verify parsing. <MarginNote>Simple test without any markdown</MarginNote>

This post demonstrates how to use both Tufte-style sidenotes[^1] and margin notes in your blog posts. <MarginNote>Margin notes are unnumbered and appear without any superscript in the main text.</MarginNote>

Sidenotes use standard footnote syntax and are numbered sequentially[^2], while margin notes use a different syntax and appear without numbers. <MarginNote>They're perfect for brief clarifications that don't need explicit referencing. You can even include **bold text**, *italic text*, `inline code`, and [markdown links](https://example.com) within them!</MarginNote>

## About Tufte-Style Sidenotes

Edward Tufte's approach to sidenotes[^3] prioritizes keeping supplementary information close to the relevant text, rather than forcing readers to jump to the bottom of the page.

The implementation follows the principles outlined in Tufte CSS[^4], providing an elegant reading experience that doesn't interrupt the flow of the main text.

## Margin Notes vs Sidenotes

Margin notes are different from sidenotes in several ways: <MarginNote>Notice how this margin note doesn't interrupt the numbering sequence of the sidenotes. Notice how this margin note doesn't interrupt the numbering sequence of the sidenotes.</MarginNote>

- **Sidenotes**: Numbered, referenced with superscript numbers in the text
- **Margin notes**: Unnumbered, inserted inline without visible markers

Both types of notes appear in the right margin[^5] and help maintain reading flow without disrupting
the main text. Reptoids are coming for me.

## Responsive Design

On mobile devices, both sidenotes and margin notes become toggleable - tap the sidenote number to show or hide the note content. <MarginNote>This margin note demonstrates **markdown support** with [links](https://tufte-css.github.io/tufte-css/)!</MarginNote>

## How to Use

**For sidenotes**, use standard Markdown footnote syntax:
- `[^1]` for the reference in your text
- `[^1]: Your sidenote content` for the definition

**For margin notes**, use the simple MDX component syntax:
- `<MarginNote>Your margin note content</MarginNote>` placed inline in text <MarginNote>This margin note demonstrates the NEW MDX component syntax - it's clean, simple, and supports **formatting** and [links](https://example.com)!</MarginNote>

> **Note**: Margin notes now use `<MarginNote>content</MarginNote>` MDX components. The content supports full markdown including **bold**, *italic*, `code`, and [links](url)!

### Positioned Margin Notes

<NoteScope>
<MarginNote top="1.5rem">This is a **positioned** margin note, anchored to the following code block. Its position is set using `top="0.5rem"`.</MarginNote>
```python
# This is a demonstration
def hello_world():
  print("Hello from a positioned note!")
```
</NoteScope>

You can also align a margin note to a specific line of code.

<NoteScope>
<MarginNote>This note is aligned with line 5 of the code block.</MarginNote>
```python
# line 1
# line 2
# line 3
# line 4
def a_very_important_function(): # line 5
  # This function is very important.
  pass # line 7
```
</NoteScope>

[^1]: This is your first sidenote! It appears in the right margin with a number that corresponds to the superscript in the text.
[^2]: Here's the second numbered sidenote, showing how they maintain sequential numbering.
[^3]: Edward Tufte is known for his work on information design and data visualization. His books demonstrate elegant typography and layout principles.
[^4]: Tufte CSS is a set of stylesheets inspired by the handouts of Edward Tufte, available at https://edwardtufte.github.io/tufte-css/
[^5]: The right margin provides space for both types of notes, with appropriate spacing between them. The right margin provides space for both types of notes, with appropriate spacing between them. The right margin provides space for both types of notes, with appropriate spacing between them.