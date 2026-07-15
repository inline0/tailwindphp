---
title: "Directives"
description: "Inline utilities with @apply, register custom utilities with @utility, define variants with @custom-variant, and control cascade order with @layer."
path: "usage/directives"
order: 4
section: "Usage"
meta_title: "Directives"
meta_description: "Inline utilities with @apply, register custom utilities with @utility, define variants with @custom-variant, and control cascade order with @layer."
---

# Directives

Directives are the `@`-prefixed at-rules you write in your input CSS to compose, extend, and order Tailwind's output. This page covers `@apply`, `@utility`, `@custom-variant`, and `@layer`. `@theme` is covered in [Theme](/docs/usage/theme); `@plugin` in [Plugins](/docs/plugins); and `@source` in [@source](/docs/usage/source).

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
@utility tab-* {
    tab-size: --value(--tab-size, integer);
}
```

`--value()` resolves the candidate's value — here either a `--tab-size-*` theme token or a bare integer — so `tab-4` produces `tab-size: 4`.

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
