---
title: "Compatibility & Upgrading"
description: "Requirements, the TailwindCSS version TailwindPHP tracks, the known differences from TailwindCSS, and what changes when you upgrade between releases."
path: "advanced/compatibility"
order: 175
section: "Advanced"
meta_title: "Compatibility & Upgrading"
meta_description: "Requirements, the TailwindCSS version TailwindPHP tracks, the known differences from TailwindCSS, and what changes when you upgrade between releases."
---

# Compatibility & Upgrading

This page collects what you need to know before upgrading or relying on exact output: the runtime requirements, which TailwindCSS release the port follows, where TailwindPHP knowingly differs from TailwindCSS, and the notes for each release. The full history is in [CHANGELOG.md](https://github.com/inline0/tailwindphp/blob/main/CHANGELOG.md).

## Requirements

- **PHP 8.2 or later.** The test suite runs on PHP 8.2, 8.3, and 8.4.
- **The `ctype` and `mbstring` extensions.** The compiler calls `ctype_*` and `mb_chr()`. Composer declares both extensions and reports missing support at installation time.
- **Optional: `pcntl`** lets the CLI's `--watch` mode stop cleanly on `SIGINT`/`SIGTERM`. Without it, watch mode still works.

No Node.js, no FFI, and no native binaries are involved.

## Which TailwindCSS release is tracked

Releases 1.7.x and 1.8.x track **TailwindCSS v4.3.3**. The upstream repository is pinned as a git submodule in `reference/tailwindcss`, its test suites are extracted from that pinned checkout, and the full suite runs on every push (see [Performance & testing](/docs/advanced/performance)). The ported plugins follow `@tailwindcss/typography` and `@tailwindcss/forms`, and the class utilities follow clsx, tailwind-merge, and CVA, each pinned the same way.

The 1.8.0 companion versions are tailwind-merge 3.7.0, clsx 2.1.1, CVA 0.7.1, @tailwindcss/typography 0.5.20, @tailwindcss/forms 0.5.11, and tw-animate-css 1.4.0. Class merging includes the Tailwind 4.3 utility groups, named containers, and logical-side conflicts. Forms base selectors now use `input:where([type=…])` and `select:where(…)`; this reduces attribute specificity and avoids resetting unrelated elements.

## Known differences from TailwindCSS

### Serialization details

Generated CSS matches the reference test suites. A few serialization details differ from what the TailwindCSS CLI prints, none of which changes the cascade:

- Vendor prefixes: where the reference emits both the authored `-webkit-*` line and a generated one, TailwindPHP emits one line.
- Downleveled pseudo-elements (`::file-selector-button`, `::-webkit-datetime-edit-*`) stay in their authored selector lists instead of being split into one rule per pseudo-element.
- Authored single-quoted strings stay single-quoted (`'Segoe UI'`) instead of being normalized to double quotes.
- Co-occurring longhands are not combined into a shorthand (Tailwind's own output never needs it).
- `.p-0` keeps `padding: 0px` where the reference CLI emits `padding: 0`, because the extracted test corpus pins the `0px` form. The minifier shortens it to `0`.

### Not included

TailwindPHP is a CSS compiler. It leaves out the editor tooling of the Tailwind ecosystem (IntelliSense, autocomplete, class sorting) and source maps, so the CLI has no `--map` option.

### Content scanning

`tw::generate()` and `TailwindCompiler::generate()` read class names from `class` and `className` attributes and static `->class('…')` or `?->class('…')` calls. Method arguments must be complete quoted strings; concatenations and dynamic expressions are not evaluated. For other PHP or JavaScript strings, use [`tw::extractCandidatesFromStrings()`](/docs/api#twextractcandidatesfromstrings) or `@source inline("…")`. Path forms of `@source` are recorded by the API and resolved by the CLI; see [What the CLI scans](/docs/cli#what-the-cli-scans).

## Upgrade notes

### 1.8.2

Legacy utility aliases supported by the pinned upstream release now compile:
`bg-gradient-to-*`, `max-w-screen-*`, `overflow-ellipsis`, `decoration-*`,
`flex-grow`/`flex-shrink`, and logical `start-*`/`end-*` insets. The PHP
`cssMap()` uses the current `inset-s-*` and `inset-e-*` names.
Clear generated CSS caches after upgrading. The legacy gradient aliases emit
`in oklab` directly, matching upstream; `bg-linear-*` keeps its existing
conditional fallbacks. Tailwind CSS remains pinned to 4.3.3.

### 1.8.1

- Bare radii, ring offsets, arbitrary backgrounds/fonts/strokes, inset shadows, and negative grid and gradient values now match the pinned upstream behavior. Clear generated CSS caches after upgrading; compiler state caches invalidate themselves.
- The API and CLI also scan static `->class('…')` method arguments. Existing attribute scanning continues to support nested quotes and HTML entities.
- Tailwind CSS remains at 4.3.3, verified as the latest stable release when 1.8.1 was prepared.

### 1.7.1

- CLI source paths, globs, and exclusions now control scanning and watching. Automatic scanning skips dependency directories; add an explicit source when you need them.
- `--optimize` keeps readable CSS; use `--minify` for minified output. Long options accept space-separated values, and `-i -` reads stdin.
- Plugin variants, typography element modifiers, CSS mixins, and reference imports now preserve their intended selectors and scope. Existing generated-output caches should be cleared after upgrading; compiler state caches invalidate themselves.
- Composer requires ctype and mbstring. Code quality passes with PHPStan 2.3.1.

### 1.7.0

- **Output changes byte-wise** compared with 1.6.x, while staying functionally equivalent to the TailwindCSS v4.3.3 reference. Among the visible changes:
  - Spacing multipliers: `p-1` emits `padding: var(--spacing)` instead of a `calc()`, and a multiplier of `0` emits a plain zero length.
  - Fractions fold to percentages: `w-1/2` emits `width: 50%`.
  - Colors: `oklch()`/`oklab()` lightness serializes as a percentage (`oklch(62.3% .214 259.815)`), `white` and `black` shorten to `#fff` and `#000`.
  - The CSS2 pseudo-elements serialize with a single colon (`:before`, `:after`, `:first-letter`, `:first-line`).
  - Nested `@media`/`@supports`/`@container` rules flatten in place, in source order, instead of being hoisted to the end; declarations are reordered the way lightningcss orders them; shadowed duplicate declarations are removed.
- **Caches keyed on output** bust once. The file cache of `tw::generate()` does not include the TailwindPHP version in its key, so run `tw::clearCache()` (or the directory you passed as `cache`) after upgrading. The [compiler state cache](/docs/advanced/caching#compiler-state-cache) invalidates itself.
- **New:** `@variant` in author CSS, CSS mixins in `@apply`, `@media reference` and `@import "…" reference`, the full `--value()`/`--modifier()` engine for functional `@utility`, stricter `@utility` name validation, and the `polyfills` option of `tw::compile()`.

### 1.6.1

- **New:** the `container` utility (`width: 100%` plus one `max-width` per breakpoint).
- Composed `--tw-*` variables (translate, scale, rotate, skew, filters, and others) are now registered with `@property`, so stylesheets gain those `@property` rules and transforms such as `translate-x-7` take effect in the browser.

### 1.6.0

- **New:** the persistent compiler state cache (`stateCacheFile` on `tw::compile()` and `TailwindCompiler`, `StateCache\compileCssCached()`), and the split `parseCssState()`/`finalizeCssState()`/`compileParsed()` functions. Existing calls behave exactly as before.

### 1.5.0

- Subclasses of `TailwindCompiler` that override `generate()` or `css()` must add the optional `bool $minify = false` parameter; PHP rejects overrides that drop a parent's optional parameter.
- Minified output comes from the serializer, so minified bytes differ slightly from 1.4.x (caches keyed on minified output bust once).
- **New:** `generateExact()` and `cssExact()` for per-page CSS from one long-lived compiler.
