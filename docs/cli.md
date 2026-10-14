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

Give long options their value with `=`: `--input=./src/app.css`, `--output=./dist/styles.css`, `--cwd=/path/to/project`. A space-separated value after a long option (`--input ./src/app.css`) is currently ignored without an error, and the build falls back to the defaults ([#13](https://github.com/inline0/tailwindphp/issues/13)). Short options take the value as the next argument (`-i ./src/app.css`).

| Option | Description | Default |
|---|---|---|
| `-i, --input` | Input CSS file; `--input=-` reads it from stdin | `@import "tailwindcss"` |
| `-o, --output` | Output file | `-` (stdout) |
| `-w, --watch` | Watch for changes and rebuild as needed | — |
| `-m, --minify` | Optimize and minify the output | — |
| `--optimize` | Documented as "optimize without minifying"; currently minifies like `--minify` ([#9](https://github.com/inline0/tailwindphp/issues/9)) | — |
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

Content scanning in the CLI does not yet follow `@source` the way `@tailwindcss/cli` does ([#8](https://github.com/inline0/tailwindphp/issues/8)). In the current release:

- **With no `@source` file directive** in the input CSS, the CLI scans the working directory (`--cwd`) recursively. That includes `vendor/` and `node_modules/`; `.gitignore` is not consulted.
- **With one or more `@source` file directives**, the CLI scans the **input file's directory** recursively. The path or glob in the directive is not applied: `@source "../templates"` next to `src/app.css` scans `src/`, not `templates/`.
- **`@source not "…"`** directives are skipped; they exclude nothing.
- **`@source inline("…")`** and **`@source not inline("…")`** work as documented, because the compiler handles them itself.

Only files with these extensions are read: `php`, `html`, `htm`, `twig`, `blade.php`, `vue`, `jsx`, `tsx`, `svelte`, `astro`, and `mdx`. Class names are taken from `class` and `className` attributes, the same as [`tw::extractCandidates()`](/docs/api#twextractcandidates), so a class that only appears in a PHP or JavaScript string is not found. Force such classes in with `@source inline("…")`.

Until that is fixed, the reliable setup is an input CSS file at the top of the directory you want scanned:

```css
/* templates/app.css: scans templates/ recursively */
@import "tailwindcss";
@source "./";
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
