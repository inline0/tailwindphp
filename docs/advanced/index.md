---
title: "Overview"
description: "The internals of TailwindPHP — how the port mirrors TailwindCSS file-for-file, the compilation pipeline, caching, minification, performance, and compatibility."
path: "advanced"
order: 140
section: "Advanced"
meta_title: "Overview"
meta_description: "The internals of TailwindPHP — how the port mirrors TailwindCSS file-for-file, the compilation pipeline, caching, minification, performance, and compatibility."
---

# Advanced

TailwindPHP is a 1:1 port of TailwindCSS 4.x to pure PHP. The guiding principle is fidelity: the codebase mirrors the original TypeScript project file-for-file — same file names, same organization — so that any behavior in TailwindCSS has an obvious home in PHP, and so that upstream changes can be tracked without guesswork.

Anything that is *not* part of the TailwindCSS port lives in one clearly marked place: `src/_tailwindphp/`. That directory holds the PHP-specific helpers — a reimplementation of the Rust `lightningcss` transforms (`LightningCss.php`), the CSS minifier (`CssMinifier.php`), and the companion library ports (`lib/`: clsx, tailwind-merge, CVA) under the `TailwindPHP\Lib\*` namespace. Everything else under `src/` corresponds to a file in TailwindCSS.

Correctness is verified against Tailwind's own test suite. Test cases are extracted directly from TailwindCSS's `.test.ts` files and run against PHP output, so any drift from the original behavior fails immediately. The result is 4,427 passing tests (release 1.7.0, against TailwindCSS v4.3.3) covering utilities, variants, directives, plugins, the CLI, and the companion libraries.

## Pages

- **[Architecture](/docs/advanced/architecture)** — the compilation pipeline (parse → scan → compile → optimize → minify), the source layout, the `lightningcss` equivalent, and the `@port-deviation` marker convention.
- **[Caching & minification](/docs/advanced/caching)** — the file-based output cache (`cache`, `cacheTtl`, `clearCache()`), the compiler state cache (`stateCacheFile`), and what the CSS minifier does.
- **[Performance & testing](/docs/advanced/performance)** — PHP-specific optimizations, how parity with TailwindCSS is verified, and the code-quality gate.
- **[Compatibility & upgrading](/docs/advanced/compatibility)** — requirements, the TailwindCSS version tracked, known differences from TailwindCSS, and upgrade notes per release.
