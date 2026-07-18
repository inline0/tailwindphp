---
title: "Overview"
description: "Generate Tailwind CSS from your content — scan markup for class names, pass optional CSS configuration, and get back only the CSS you use."
path: "usage"
order: 30
section: "Usage"
meta_title: "Overview"
meta_description: "Generate Tailwind CSS from your content — scan markup for class names, pass optional CSS configuration, and get back only the CSS you use."
---

# Usage

The core workflow is a single call: give TailwindPHP your content plus optional CSS configuration, and it returns the CSS for the classes it finds. Class names are extracted from the markup, compiled against the resolved theme, and the result contains only the utilities you actually use.

```php
use TailwindPHP\tw;

$css = tw::generate('<div class="flex items-center p-4 bg-blue-500">Hello</div>');
```

With no second argument, `generate()` uses a default `@import "tailwindcss"` (theme + [Preflight](/docs/usage/imports) + utilities). Pass a CSS string or an array to customize.

## Content scanning

TailwindPHP finds class names by reading the `class` and `className` attributes in your content. To inspect what gets pulled out, use `tw::extractCandidates()`:

```php
use TailwindPHP\tw;

tw::extractCandidates('<div class="flex p-4" className="bg-blue-500">');
// ['flex', 'p-4', 'bg-blue-500']
```

Both `class` and `className` attributes are scanned, and the returned list is deduplicated. Arbitrary candidates (such as `[mask-type:luminance]` or `bg-[#1da1f2]`) are extracted the same way and compiled if they are valid. Whatever appears here is exactly what `generate()` will compile.

## Input formats

Every static method accepts the same three input shapes:

| Format | Signature | Use when |
|--------|-----------|----------|
| String only | `tw::generate($content)` | Default theme, no customization. |
| String + CSS string | `tw::generate($content, $css)` | Quick theme tweaks or directives inline. |
| Array | `tw::generate(['content' => ..., 'css' => ...])` | You need `minify`, `importPaths`, or `cache`. |

```php
use TailwindPHP\tw;

// Format 1: String only
tw::generate('<div class="flex">');

// Format 2: String + CSS string
tw::generate('<div class="flex">', '@import "tailwindcss"; @theme { --color-brand: #3b82f6; }');

// Format 3: Array with content, css, and options
tw::generate([
    'content' => '<div class="flex p-4">',
    'css'     => '@import "tailwindcss";',
    'minify'  => true,
]);
```

The array form is the only one that takes options. Beyond `css` and `minify` it accepts `importPaths` (see [Imports](/docs/usage/imports)), `cache`, and `cacheTtl` (see [Caching](/docs/advanced/caching)).

## Reusable compiler

Compiling many fragments against the same configuration — a request loop, a batch of templates, a component library — is cheaper with a single compiler instance. `tw::compile()` resolves the theme and design system once, then reuses them:

```php
use TailwindPHP\tw;

$compiler = tw::compile('@import "tailwindcss"; @theme { --color-brand: #3b82f6; }');

$css        = $compiler->generate('<div class="flex p-4 bg-brand">');
$candidates = $compiler->extractCandidates('<div class="flex p-4 bg-brand">');
$minified   = $compiler->minify($css);
```

The compiler also exposes property inspection (`properties()`, `computedProperties()`, `value()`, `computedValue()`) and theme accessors (`colors()`, `breakpoints()`, `spacing()`). See the full [API](/docs/api) for every method.

## Configuring the input CSS

Most of TailwindPHP's power lives in the CSS string you pass as configuration. Continue with:

- [Theme](/docs/usage/theme) — `@theme` variables and namespaces.
- [Directives](/docs/usage/directives) — `@apply`, `@utility`, `@layer`, `@custom-variant`.
- [Imports](/docs/usage/imports) — `@import`, virtual modules, `importPaths`, and Preflight.
- [@source](/docs/usage/source) — control which files and classes are scanned.
