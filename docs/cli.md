---
title: "CLI"
description: "The bin/tailwindphp command — builds, watches, and minifies CSS from an input file with the @tailwindcss/cli options and no Node.js."
path: "cli"
order: 180
section: "Reference"
meta_title: "CLI"
meta_description: "The bin/tailwindphp command — builds, watches, and minifies CSS from an input file with the @tailwindcss/cli options and no Node.js."
---

# CLI

`./vendor/bin/tailwindphp` is a PHP port of **[@tailwindcss/cli](https://github.com/tailwindlabs/tailwindcss/tree/next/packages/%40tailwindcss-cli)** with no Node.js required. It takes the same build options, apart from source maps (`--map`), but scans content differently: see [What the CLI scans](#what-the-cli-scans). After `composer require tailwindphp/tailwindphp`, the binary is linked into `vendor/bin/`.

If you only need CSS at runtime from PHP, use the [API](/docs/api) instead — the CLI is for build-step workflows that write a stylesheet to disk.

## Quick start

```bash
# Build CSS from an input file
./vendor/bin/tailwindphp -i ./src/app.css -o ./dist/styles.css

# Watch for changes and rebuild
./vendor/bin/tailwindphp -i ./src/app.css -o ./dist/styles.css --watch

# Build minified for production
./vendor/bin/tailwindphp -i ./src/app.css -o ./dist/styles.css --minify
```

## Options

```bash
tailwindphp [-i input.css] [-o output.css] [--watch] [options…]
```

Long options accept either a space or `=`: `--input ./src/app.css`, `--output=./dist/styles.css`, and `--cwd /path/to/project`. Short options take the next argument (`-i ./src/app.css`). `-i -` and `--input -` read stdin. A missing input, output, or working-directory value exits with an error.

| Option | Description | Default |
|---|---|---|
| `-i, --input` | Input CSS file; `--input=-` reads it from stdin | `@import "tailwindcss"` |
| `-o, --output` | Output file | `-` (stdout) |
| `-w, --watch` | Watch for changes and rebuild as needed | — |
| `-m, --minify` | Optimize and minify the output | — |
| `--optimize` | Optimize without minifying; output remains readable | — |
| `--cwd` | The current working directory | `.` |
| `-h, --help` | Display usage information | — |
| `-V, --version` | Print the version | — |
| `-v, --verbose` | Print the stack trace when a build fails | — |

When `--output` is `-` (the default), the compiled CSS is written to stdout, so you can pipe it elsewhere. Progress messages (the version banner and `Done in …ms`) go to stderr.

Unlike `@tailwindcss/cli`, there is no `--map` option: TailwindPHP does not generate source maps.

## Input CSS

Create an `app.css` with your Tailwind import, theme, and directives:

```css
@import "tailwindcss";

@theme {
    --color-brand: #3b82f6;
}
```

## What the CLI scans

The CLI resolves file sources relative to the input CSS file:

- **With one or more positive `@source` paths**, only matching files are scanned. Directories are recursive; globs support `*`, `**`, `?`, character classes, and brace groups.
- **`@source not "…"`** removes matching files from scanning and watching, regardless of directive order.
- **With no positive file sources**, the CLI scans the working directory (`--cwd`) recursively and applies any exclusions. Automatic scanning skips `.git`, `vendor`, and `node_modules` directories. Explicit sources can include dependencies. `.gitignore` is not consulted.
- **`@source inline("…")`** and **`@source not inline("…")`** add and remove candidates through the compiler.

Directory and glob scans read `php`, `html`, `htm`, `twig`, `blade.php`, `vue`, `jsx`, `tsx`, `svelte`, `astro`, and `mdx` files. An explicit file path can name another extension. Class names are taken from `class` and `className` attributes and static `->class('…')` or `?->class('…')` method calls, the same as [`tw::extractCandidates()`](/docs/api#twextractcandidates). For other PHP or JavaScript strings, use `@source inline("…")`.

```css
/* src/app.css: scans templates/, excluding templates/legacy/ */
@import "tailwindcss";
@source "../templates/**/*.html";
@source not "../templates/legacy";
```

See [@source](/docs/usage/source) for the directive syntax, including the `not` and `inline()` forms.

## Examples

```bash
# Build from an input file
tailwindphp -i ./src/app.css -o ./dist/styles.css

# Build minified for production
tailwindphp -i ./src/app.css -o ./dist/styles.css -m

# Watch mode with minification
tailwindphp -i ./src/app.css -o ./dist/styles.css -w -m

# Run against a different working directory
tailwindphp -i app.css -o dist/styles.css --cwd=/path/to/project
```

The CLI creates the output directory if it does not exist, and exits with an error if the input file is missing or the input and output paths are identical. Watch mode polls the input file and the scanned files every 500 ms and rebuilds when one of them changes or a new file appears.

## Global installation

Install globally to use `tailwindphp` from anywhere:

```bash
composer global require tailwindphp/tailwindphp

# Now available globally
tailwindphp -i ./src/app.css -o ./dist/styles.css
```

See [Getting Started](/docs/getting-started) for project setup and the [API](/docs/api) for runtime CSS generation from PHP.
