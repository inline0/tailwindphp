---
title: "Architecture"
description: "How TailwindPHP mirrors TailwindCSS file-for-file, the compilation pipeline, the lightningcss equivalent, and where the PHP port deviates."
path: "advanced/architecture"
order: 14
section: "Advanced"
meta_title: "Architecture"
meta_description: "How TailwindPHP mirrors TailwindCSS file-for-file, the compilation pipeline, the lightningcss equivalent, and where the PHP port deviates."
---

# Architecture

TailwindPHP is a 1:1 port. The codebase mirrors TailwindCSS's own structure — same file names, same organization — and isolates the parts that *cannot* be a direct port (PHP has no Rust, no V8) under `src/_tailwindphp/`. This page walks the compilation pipeline, the source layout, the `lightningcss` reimplementation, and the convention used to document deviations.

## The pipeline

Generating CSS is a sequence of stages. There is no separate build step — each call to `tw::generate()` runs the full pipeline.

```
CSS input          (@import "tailwindcss"; @theme { … })
  │
  ▼
┌──────────────┐
│  Parse CSS   │  css-parser.php → ast.php nodes
└──────┬───────┘
       ▼  design system (theme, utilities, variants)
┌──────────────┐
│ Scan content │  candidate.php — extract class names from HTML
└──────┬───────┘
       ▼  candidates
┌──────────────┐
│   Compile    │  compile.php — candidate → AST, via design-system.php
└──────┬───────┘
       ▼  AST
┌──────────────┐
│   Optimize   │  _tailwindphp/LightningCss.php — nesting, @media, calc()
└──────┬───────┘
       ▼  ast.php toCss()
┌──────────────┐
│   Minify     │  _tailwindphp/CssMinifier.php   (optional)
└──────┬───────┘
       ▼
CSS output
```

**Parse.** `css-parser.php` reads the CSS input — `@import`, `@theme`, `@utility`, `@layer`, raw rules — into an abstract syntax tree of `ast.php` nodes (style rules, at-rules, declarations). `@import` directives for virtual modules (`tailwindcss`, `tailwindcss/preflight`, …) and file paths are resolved and substituted at this stage.

**Build the design system.** `theme.php` resolves theme values (colors, spacing, breakpoints) from the parsed `@theme` blocks plus the defaults. `design-system.php` is the central registry that ties the theme to the utility and variant lookups defined in `utilities.php` and `variants.php`.

**Scan content.** `candidate.php` extracts class-name candidates from the supplied content (HTML, templates) and parses each into its parts — base utility, variants, modifiers, arbitrary values, important flag.

**Compile.** `compile.php` turns each candidate into AST nodes by looking it up in the design system, applying its variants and modifiers. Candidates that don't resolve to a real utility are discarded.

**Serialize and optimize.** `ast.php`'s `toCss()` walks the tree (helpers in `walk.php`) and emits the CSS string. The `lightningcss`-equivalent transforms in `_tailwindphp/LightningCss.php` are applied so the output matches what TailwindCSS produces after its Rust post-processing pass.

**Minify.** When `minify` is enabled, `_tailwindphp/CssMinifier.php` runs as a final pass. See [Caching & minification](/docs/advanced/caching).

## Source layout

`src/` mirrors TailwindCSS. The one structural change: TailwindCSS's `utilities.ts` is 6,000+ lines, so it is split into `src/utilities/` with one file per category for maintainability.

```
src/
├── _tailwindphp/                # PHP-specific — NOT part of the TailwindCSS port
│   ├── LightningCss.php         # CSS transforms (lightningcss Rust library equivalent)
│   ├── CssMinifier.php          # CSS minification
│   └── lib/                     # Companion library ports (TailwindPHP\Lib\*)
│       ├── clsx/                # clsx port
│       ├── tailwind-merge/      # tailwind-merge port
│       └── cva/                 # CVA port
│
├── plugin/                      # Plugin system
│   └── plugins/
│       ├── typography-plugin.php  # @tailwindcss/typography port
│       └── forms-plugin.php       # @tailwindcss/forms port
│
├── utilities/                   # Split from TailwindCSS utilities.ts (one file per category)
│   ├── accessibility.php        # sr-only, forced-colors
│   ├── backgrounds.php          # bg-*, gradient-*, from-*, via-*, to-*
│   ├── borders.php              # border-*, rounded-*, divide-*, outline-*
│   ├── effects.php              # shadow-*, opacity-*, mix-blend-*
│   ├── filters.php              # blur-*, brightness-*, contrast-*, …
│   ├── flexbox.php              # flex-*, grid-*, gap-*, justify-*, align-*
│   ├── interactivity.php        # cursor-*, scroll-*, touch-*, select-*
│   ├── layout.php               # display, position, z-*, overflow-*, …
│   ├── masks.php                # mask-linear-*, mask-radial-*, mask-conic-*
│   ├── sizing.php               # w-*, h-*, min-*, max-*, size-*
│   ├── spacing.php              # m-*, p-*, space-*
│   ├── svg.php                  # fill-*, stroke-*
│   ├── tables.php               # border-collapse, table-layout
│   ├── transforms.php           # translate-*, rotate-*, scale-*, skew-*
│   ├── transitions.php          # transition-*, duration-*, ease-*, delay-*
│   └── typography.php           # font-*, text-*, leading-*, tracking-*
│
├── utils/                       # Helper functions (ported from utils/)
│
├── index.php                    # Main entry — compile(), cn(), variants(), merge(), join()
├── ast.php                      # AST nodes and toCss()
├── candidate.php                # Candidate parsing (class name → parts)
├── compile.php                  # Candidate to CSS compilation
├── css-functions.php            # theme(), --theme(), --spacing(), --alpha()
├── css-parser.php               # CSS parsing
├── design-system.php            # Central registry for utilities/variants
├── plugin.php                   # Plugin system (PluginInterface, PluginAPI, PluginManager)
├── theme.php                    # Theme value resolution
├── utilities.php                # Utility registration and lookup
├── value-parser.php             # CSS value parsing
├── variants.php                 # Variant handling (hover, focus, responsive, …)
└── walk.php                     # AST traversal
```

## The lightningcss equivalent

TailwindCSS delegates its CSS post-processing — nesting, media-query handling, value simplification — to [lightningcss](https://lightningcss.dev/), a parser/transformer/minifier written in Rust. PHP can't load a Rust library, so `src/_tailwindphp/LightningCss.php` reimplements the transforms TailwindPHP actually relies on, producing byte-identical output for the cases the test suite covers.

Confirmed transforms include:

| Transform | What it does |
|-----------|--------------|
| Nesting flattening | Resolves `&` selectors and flattens nested rules to top-level selectors (`transformNesting`) |
| `@media` hoisting | Moves nested media queries up to the top level (`transformNesting`, `mergeAtRules`) |
| `calc()` simplification | Simplifies `calc()` expressions (`simplifyCalcExpressions`) |
| Leading-zero removal | `0.5` → `.5` (`normalizeLeadingZeros`) |
| Transform-function spacing | Normalizes spacing inside transform functions (`normalizeTransformFunctions`) |
| Grid value normalization | Adds spaces around `/` in span values, bare integers → px for `grid-template-*` (`normalizeGridValues`) |
| Color normalization | Normalizes color syntax and evaluates `color-mix()` to `oklab()` (`normalizeColors`, `evaluateColorMix`) |
| URL quoting | `url(./x.jpg)` → `url("./x.jpg")` (`normalizeUrlQuoting`) |
| Vendor prefixes | Autoprefixer-equivalent prefixing (`addVendorPrefixes`) |

This file is deliberately quarantined under `_tailwindphp/` and marked `@port-deviation:replacement` — it stands in for an external dependency rather than porting TailwindCSS source.

## Port deviation markers

Every implementation file carries `@port-deviation:*` markers in its docblock that state where and why the PHP implementation departs from the TypeScript original. The goal is that a reader comparing PHP to TailwindCSS source never has to wonder whether a difference is intentional.

| Marker | Meaning |
|--------|---------|
| `@port-deviation:none` | Direct 1:1 port with no significant deviations |
| `@port-deviation:async` | PHP uses synchronous code instead of async/await |
| `@port-deviation:storage` | Different data structures (PHP array vs JS Map/Set) |
| `@port-deviation:types` | PHPDoc annotations instead of TypeScript types |
| `@port-deviation:sourcemaps` | Source-map tracking omitted |
| `@port-deviation:enum` | PHP constants instead of TypeScript enums |
| `@port-deviation:errors` | Different error-handling approach |
| `@port-deviation:replacement` | PHP implementation replacing an external library (e.g. lightningcss) |
| `@port-deviation:helper` | PHP-specific helper not in the original |
| `@port-deviation:performance` | PHP-specific optimization that preserves identical output |
| `@port-deviation:omitted` | Entire module/feature not ported (outside scope) |

For the `@port-deviation:performance` markers and how parity is enforced, see [Performance & testing](/docs/advanced/performance).
