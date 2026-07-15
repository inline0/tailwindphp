---
title: "Typography Plugin"
description: "The @tailwindcss/typography port adds the prose classes — typographic defaults for rendered HTML — with size, color, and invert modifiers."
path: "plugins/typography"
order: 10
section: "Plugins"
meta_title: "Typography Plugin"
meta_description: "The @tailwindcss/typography port adds the prose classes — typographic defaults for rendered HTML — with size, color, and invert modifiers."
---

# Typography Plugin

`@tailwindcss/typography` is a 1:1 PHP port of the official typography plugin. It adds the `prose` class and its modifiers, which apply readable typographic defaults to a block of rendered HTML — headings, paragraphs, lists, blockquotes, code, tables, and more — without styling each element by hand.

## Usage

Load the plugin with `@plugin` and import the utilities layer, then apply `prose` to the container that wraps your content:

```php
use TailwindPHP\tw;

$css = tw::generate(
    '<article class="prose prose-lg"><h1>Title</h1><p>Body text…</p></article>',
    '@plugin "@tailwindcss/typography"; @import "tailwindcss/utilities.css";'
);
```

The generated `.prose` rule defines `--tw-prose-*` custom properties (`--tw-prose-body`, `--tw-prose-headings`, `--tw-prose-links`, `--tw-prose-code`, `--tw-prose-quotes`, and others) and styles the descendant elements through them.

## Classes

### Sizes

Size modifiers scale the entire type ramp. They are applied alongside the base `prose` class:

| Class | Purpose |
|-------|---------|
| `prose` | Default size |
| `prose-sm` | Small |
| `prose-base` | Base |
| `prose-lg` | Large |
| `prose-xl` | Extra large |
| `prose-2xl` | 2× extra large |

```html
<article class="prose prose-xl">…</article>
```

### Color themes

Color modifiers swap the gray scale used for body text, headings, and borders:

| Class | Theme |
|-------|-------|
| `prose-slate` | Slate |
| `prose-gray` | Gray |
| `prose-zinc` | Zinc |
| `prose-neutral` | Neutral |
| `prose-stone` | Stone |

### Invert

`prose-invert` flips the color palette for use on dark backgrounds. Combine it with size and color modifiers freely:

```html
<article class="prose prose-lg prose-slate prose-invert">…</article>
```

## Options

### `className`

By default the plugin generates the `prose` class. Set `className` to rename it — the modifiers follow the new name (`markdown`, `markdown-lg`, `markdown-invert`, …). When set, `prose` classes are not generated:

```php
$css = tw::generate(
    '<article class="markdown markdown-lg">…</article>',
    '
        @plugin "@tailwindcss/typography" {
            className: "markdown";
        }
        @import "tailwindcss/utilities.css";
    '
);
```

## Notes

This is a TailwindCSS v4 port. Some v3-specific behaviors from the original plugin — `.dark`-selector dark mode and certain element-variant config formats — work differently in v4 and are not supported here; use the `prose-invert` modifier and v4 variants instead.

See [Plugins](/docs/plugins) for the `@plugin` directive and loading details.
