---
title: "CLI"
description: "The bin/tailwindphp command — a 1:1 port of @tailwindcss/cli that builds, watches, and minifies CSS with no Node.js."
path: "cli"
order: 17
section: "Documentation"
meta_title: "CLI"
meta_description: "The bin/tailwindphp command — a 1:1 port of @tailwindcss/cli that builds, watches, and minifies CSS with no Node.js."
---

# CLI

`./vendor/bin/tailwindphp` is a **1:1 port of [@tailwindcss/cli](https://github.com/tailwindlabs/tailwindcss/tree/next/packages/%40tailwindcss-cli)** — same options, same behavior, no Node.js required. After `composer require tailwindphp/tailwindphp`, the binary is linked into `vendor/bin/`.

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
tailwindphp [--input input.css] [--output output.css] [--watch] [options…]
```

| Option | Description | Default |
|---|---|---|
| `-i, --input` | Input CSS file | `@import "tailwindcss"` |
| `-o, --output` | Output file | `-` (stdout) |
| `-w, --watch` | Watch for changes and rebuild as needed | — |
| `-m, --minify` | Optimize and minify the output | — |
| `--optimize` | Optimize the output without minifying | — |
| `--cwd` | The current working directory | `.` |
| `-h, --help` | Display usage information | — |

When `--output` is `-` (the default), the compiled CSS is written to stdout, so you can pipe it elsewhere.

## Input CSS

Create an `app.css` with your Tailwind import and a `@source` directive telling TailwindPHP where to scan for classes:

```css
@import "tailwindcss";
@source "./templates"; /* Directory to scan for classes */
```

`@source` accepts directories, glob patterns, and multiple entries:

```css
@import "tailwindcss";
@source "./templates";           /* a directory */
@source "./src/**/*.php";         /* a glob */
@source "./resources/views";      /* add as many as you need */
```

See [@source](/docs/usage/source) for the full directive reference, including `not` and `inline()` forms.

## Examples

```bash
# Build from CSS with a @source directive
tailwindphp -i ./src/app.css -o ./dist/styles.css

# Build minified for production
tailwindphp -i ./src/app.css -o ./dist/styles.css -m

# Watch mode with minification
tailwindphp -i ./src/app.css -o ./dist/styles.css -w -m

# Run against a different working directory
tailwindphp -i app.css -o dist/styles.css --cwd=/path/to/project
```

The CLI creates the output directory if it does not exist, and exits with an error if the input file is missing or the input and output paths are identical.

## Global installation

Install globally to use `tailwindphp` from anywhere:

```bash
composer global require tailwindphp/tailwindphp

# Now available globally
tailwindphp -i ./src/app.css -o ./dist/styles.css
```

See [Getting Started](/docs/getting-started) for project setup and the [API](/docs/api) for runtime CSS generation from PHP.
