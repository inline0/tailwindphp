---
title: "Directives"
description: "Inline utilities with @apply, register custom utilities with @utility, define variants with @custom-variant, and control cascade order with @layer."
path: "usage/directives"
order: 50
section: "Usage"
meta_title: "Directives"
meta_description: "Inline utilities with @apply, register custom utilities with @utility, define variants with @custom-variant, and control cascade order with @layer."
---

# Directives

Directives are the `@`-prefixed at-rules you write in your input CSS to compose, extend, and order Tailwind's output. This page covers `@apply`, `@utility`, `@variant`, `@custom-variant`, and `@layer`. `@theme` is covered in [Theme](/docs/usage/theme); `@plugin` in [Plugins](/docs/plugins); and `@source` in [@source](/docs/usage/source).

## `@apply`

`@apply` inlines the declarations of existing utilities into your own selector. Use it to attach utility styles to a semantic class, including inside nested selectors and media queries.

```php
use TailwindPHP\tw;

$css = tw::generate('<div class="btn">', '
    @import "tailwindcss";

    @theme { --color-brand: #3b82f6; }

    .btn {
        @apply px-4 py-2 rounded-lg bg-brand text-white;
    }
');
```

Variants work in an `@apply` list — `@apply bg-blue-500 hover:bg-blue-600;` expands the `:hover` state, and responsive prefixes such as `@apply px-4 md:px-6 lg:px-8;` emit the corresponding `@media` rules. The important modifier is honored too (`@apply !flex;`). Nested selectors are supported, so a rule like `.card { h2 { @apply text-xl font-bold; } }` applies utilities to the nested `h2`.

`@apply` is a statement: `@apply px-4 { … }` with a body throws. An `@apply` that lists only dashed idents (`@apply --my-mixin;`) is a CSS mixin from the [CSS mixins draft](https://drafts.csswg.org/css-mixins-1/#apply-rule), not a utility list, so TailwindPHP does not resolve it; putting a mixin and utilities in the same `@apply` throws (`You cannot use @apply with both mixins and utilities…`). Mixin rules are currently dropped from the output rather than passed through ([#12](https://github.com/inline0/tailwindphp/issues/12)).

## `@utility`

`@utility` registers a custom utility that participates in Tailwind's engine — it sorts into the `utilities` layer and accepts variants like any built-in. A static utility takes a fixed body:

```css
@utility content-auto {
    content-visibility: auto;
}
```

Because it is a real utility, variants compose automatically (`hover:content-auto`, `md:content-auto`). The body may itself use `@apply` and nested selectors:

```css
@utility btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded;
}

@utility card {
    color: red;
    &:hover { color: blue; }
}
```

A functional utility uses a `-*` suffix in the name and reads the matched value with `--value()`:

```css
@theme {
    --gutter-wide: 3rem;
}

@utility gutter-* {
    padding-inline: --value(--gutter-*, [length]);
    padding-inline: --spacing(--value(integer));
}
```

`--value()` resolves the candidate's value against each source in turn: a theme namespace (`--gutter-*`), an arbitrary value with a data type (`[length]`), or a bare value type (`integer`, `number`, `percentage`, `ratio`). A declaration whose `--value()` does not resolve is dropped, so stacking declarations gives a fallback chain:

| Class | Output |
|---|---|
| `gutter-wide` | `padding-inline: var(--gutter-wide);` |
| `gutter-[5px]` | `padding-inline: 5px;` |
| `gutter-4` | `padding-inline: calc(var(--spacing) * 4);` |

`--modifier()` resolves the part after a `/` the same way: with `line-height: --modifier(integer);` in the body, `gutter-4/7` also emits `line-height: 7`. Utility names follow the TailwindCSS v4.3.3 rules: at most one `/`, `%` only at the end after a digit, and dots only between digits.

## `@variant`

`@variant` applies a variant to declarations inside your own CSS, without defining a utility:

```css
.card {
    color: red;

    @variant hover {
        color: blue;
    }

    @variant dark {
        color: white;
    }
}
```

```css
.card {
  color: red;
}
@media (hover: hover) {
  .card:hover {
    color: #00f;
  }
}
@media (prefers-color-scheme: dark) {
  .card {
    color: #fff;
  }
}
```

Variants can be stacked (`@variant hover:focus`), listed with commas, nested inside each other, and can name your own `@custom-variant`s. A top-level `@variant` without a body, or with `@slot`, is treated as `@custom-variant` for backwards compatibility.

## `@custom-variant`

`@custom-variant` defines a new variant you can prefix onto any utility. The compact form names the variant and gives a selector or at-rule in parentheses.

A selector-list variant uses `&` for the element:

```css
@custom-variant hocus (&:hover, &:focus);
```

`hocus:bg-blue-500` then emits both the `:hover` and `:focus` rules. An attribute form works the same way:

```css
@custom-variant loading (&[data-loading="true"]);
```

An at-rule variant wraps matched utilities in that at-rule:

```css
@custom-variant tablet (@media (min-width: 600px));
```

Custom variants stack with built-ins — `sm:hocus:bg-blue-500` nests the `hocus` selector inside the `sm` media query. For more involved cases, use the block form with `@slot` marking where the utility's declarations are injected:

```css
@custom-variant child {
    & > * {
        @slot;
    }
}

@custom-variant sidebar-open {
    .sidebar-open & {
        @slot;
    }
}
```

## `@layer`

`@layer` controls cascade order using native CSS cascade layers. A bare `@layer` statement declares the order of layers; later layers win regardless of selector specificity. Tailwind's canonical order is:

```css
@layer theme, base, components, utilities;
```

This is exactly what `@import "tailwindcss"` sets up internally. You can declare your own order, or split it across multiple statements (`@layer reset, base;` then `@layer components, utilities;`), and assign rules to a named layer with a block:

```php
use TailwindPHP\tw;

$css = tw::generate('<article><h1>Title</h1></article>', '
    @import "tailwindcss";

    @layer base {
        h1 { font-size: var(--text-2xl); }
        a  { color: var(--color-blue-600); text-decoration-line: underline; }
    }
');
```

Adding base styles via `@layer base` keeps them below `components` and `utilities`, so a utility class always overrides your element defaults. The same applies to `@layer components { … }` for component classes that should sit beneath utilities. Anonymous layers and `layer()` modifiers on `@import` are covered in [Imports](/docs/usage/imports).

## Next steps

- [Theme](/docs/usage/theme) — `@theme` tokens and the theme functions.
- [Imports](/docs/usage/imports) — `@import`, virtual modules, and `layer()` modifiers.
- [Plugins](/docs/plugins) — the `@plugin` directive and the plugin API.
- [@source](/docs/usage/source) — control which files and classes are scanned.
