---
title: "Extended Markdown Features"
published: "2023-06-15"
description: "Demonstrating the extended Markdown features available in this blog"
showtoc: false
---

This post demonstrates the extended Markdown features available in this blog.

## Basic Formatting

You can use **bold**, *italic*, and ~~strikethrough~~ text.

## Lists

Unordered list:
- Item 1
- Item 2
- Item 3

Ordered list:
1. First item
2. Second item
3. Third item

Task list:
- [x] Completed task
- [ ] Incomplete task

## Code

Inline code: `const greeting = "Hello, world!";`

Code block with syntax highlighting:

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("Reader"));
```

## Tables

| Name  | Age | Occupation    |
|-------|-----|---------------|
| Alice | 28  | Developer     |
| Bob   | 32  | Designer      |
| Carol | 45  | Product Owner |

## Blockquotes

> This is a blockquote.
> 
> It can span multiple lines.

## Math Equations

Inline math: $E = mc^2$

Display math:

$$
\frac{d}{dx}(e^x) = e^x
$$

## Sidenotes

You can add sidenotes[^1] to provide additional context without interrupting the flow of your main text. These appear in the right margin on larger screens[^2] and become toggleable on mobile devices.

## Custom Callouts

<Callout type="info">
  This is an informational callout.
</Callout>

<Callout type="warning">
  This is a warning callout.
</Callout>

<Callout type="error">
  This is an error callout.
</Callout>

<Callout type="success">
  This is a success callout.
</Callout>

## Links

[External link](https://example.com)

[Internal link](/blog/hello-world)

## Images

You can include images like this:

![Alt text](/placeholder.svg?height=200&width=400)

## Horizontal Rule

---

That's it! You now have a reference for all the extended Markdown features available in this blog.

[^1]: This is an example sidenote! It provides additional information without cluttering the main text. Unlike traditional footnotes, sidenotes appear in the margin next to the relevant text.

[^2]: The sidenotes automatically adapt to different screen sizes. On mobile devices, they become toggleable by tapping the sidenote number.
