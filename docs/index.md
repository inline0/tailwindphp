---
title: "Introduction"
description: "A 1:1 port of TailwindCSS 4.x to PHP. Generate Tailwind utility CSS with pure PHP — no Node.js, no build step — plus cn(), tailwind-merge, CVA, and the typography and forms plugins."
path: "."
order: 10
meta_title: "Introduction"
meta_description: "A 1:1 port of TailwindCSS 4.x to PHP. Generate Tailwind utility CSS with pure PHP — no Node.js, no build step — plus cn(), tailwind-merge, CVA, and the typography and forms plugins."
---

# TailwindPHP

TailwindPHP is a **1:1 port of TailwindCSS 4.x to PHP**. It parses your CSS, scans your markup for class names, and generates the utility CSS that TailwindCSS v4.3.3 produces — entirely in PHP, with no Node.js and no build step.

- **Pure PHP** — ships as a Composer package and runs on PHP 8.2+ with the standard `ctype` and `mbstring` extensions. No `exec`, no FFI, no native build tooling.
- **Checked against TailwindCSS** — utilities, variants, directives, and CSS functions track TailwindCSS v4.3.3. Output is verified against Tailwind's own test suites, extracted from the TypeScript source and re-run on every push (4,400+ tests). The known differences (a few serialization details with no cascade effect, plus open issues) are listed in [Compatibility & upgrading](/docs/advanced/compatibility).
- **The whole feature set** — the full TailwindCSS v4.3.3 utility set (including `container`, the scrollbar utilities, `zoom-*` and `tab-*`), every variant (hover, focus, responsive, dark mode, container queries, arbitrary values), and the full directive surface: `@import`, `@theme`, `@apply`, `@utility`, `@variant`, `@custom-variant`, `@layer`, `@plugin`, and `@source`.
- **Batteries included** — `cn()`, `merge()`, `join()`, and `variants()` bundle PHP ports of clsx, tailwind-merge, and CVA, so the companion libraries every Tailwind project reaches for are already there.
- **Plugins** — `@tailwindcss/typography` and `@tailwindcss/forms` are ported in full, and a PHP plugin API lets you write your own.

## Why TailwindPHP exists

TailwindCSS is written in TypeScript and runs on Node.js. That's a hard requirement for any PHP project that wants Tailwind: a second runtime, an npm install, and a build step in CI and Docker. For a lot of PHP applications that's friction they'd rather not take on.

TailwindPHP removes it. Your PHP code compiles Tailwind CSS directly, using only the standard library. That unlocks a few things that are awkward or impossible with the JavaScript toolchain:

- **WordPress and PHP frameworks** — ship Tailwind-powered themes and plugins without asking users to install Node.js or run a build. Just `composer require` and go. See [TailwindWP](https://github.com/dnnsjsk/tailwindwp), an example WordPress plugin that generates block-editor CSS with TailwindPHP.
- **Runtime CSS** — generate utility CSS on the fly from user input, database content, or template variables, instead of at build time.
- **Simpler deployment** — no Node.js in production, no build step in CI, no npm in your Docker image.

It's the same idea [scssphp](https://github.com/scssphp/scssphp) brought to SCSS — the full compiler, in PHP.

## What it does

- Compiles the TailwindCSS v4.3.3 utility set, variants, and arbitrary values from class names found in your content.
- Resolves the full directive surface: `@import` (including virtual modules like `tailwindcss` and `tailwindcss/utilities`, and `reference` imports), `@theme`, `@apply`, `@utility`, `@variant`, `@custom-variant`, `@layer`, `@plugin`, and `@source`.
- Implements Tailwind's CSS functions — `theme()`, `--theme()`, `--spacing()`, and `--alpha()` — plus `color-mix()` → `oklab()` conversion and the CSS transforms TailwindCSS delegates to LightningCSS.
- Resolves `@import` from the filesystem with nested imports, deduplication, and custom resolvers, or from inline CSS strings.
- Ships Preflight (Tailwind's base reset), prefix support, `@property` fallbacks, vendor prefixing, and keyframe hoisting.
- Bundles `cn()`, `merge()`, `join()`, and `variants()`/`compose()` for class-name construction, conflict resolution, and component variants.
- Includes the typography and forms plugins, plus a plugin API (`addUtilities`, `matchUtilities`, `addComponents`, `addVariant`, `theme`, …) for custom plugins.
- Provides a CLI (`bin/tailwindphp`) with the `@tailwindcss/cli` build options, plus file-based output caching, a persistent compiler state cache, and a CSS minifier for production.

## What it is not

TailwindPHP is a CSS compiler, not an editor toolchain. It deliberately leaves out the IDE-facing pieces of the Tailwind ecosystem — IntelliSense, autocomplete, class sorting, and source maps — because those are editor features, not part of CSS generation. Everything that produces CSS is in scope; everything that powers your editor is not.

## Where to start

- [Getting Started](/docs/getting-started) — install the package and generate your first stylesheet.
- [Usage](/docs/usage) — scan content, customize the theme, and use Tailwind's directives.
- [Class Utilities](/docs/class-utilities) — `cn()`, `merge()`, `join()`, and `variants()`.
- [Plugins](/docs/plugins) — typography, forms, and writing your own.
- [API](/docs/api) — the full `tw` surface and the `TailwindCompiler` instance.
- [CLI](/docs/cli) — `bin/tailwindphp` for file-based builds and watch mode.
- [Advanced](/docs/advanced) — architecture, caching, performance, and compatibility notes.
