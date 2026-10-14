---
title: "Caching & Minification"
description: "The file-based output cache (cache, cacheTtl, clearCache), the compiler state cache (stateCacheFile), and the CSS minifier that shrinks output for production."
path: "advanced/caching"
order: 160
section: "Advanced"
meta_title: "Caching & Minification"
meta_description: "The file-based output cache (cache, cacheTtl, clearCache), the compiler state cache (stateCacheFile), and the CSS minifier that shrinks output for production."
---

# Caching & Minification

Three production concerns sit at the edge of the pipeline: avoiding recompilation of identical input, avoiding the cost of building a compiler on every request, and shrinking the generated CSS. All three are PHP-side helpers around the compiler.

## Caching

CSS generation runs the whole pipeline on every call. For content that doesn't change between requests, the file-based cache writes the result to disk and serves it on subsequent calls.

Pass `cache` to `tw::generate()` — `true` for the default directory, or a path string for a custom one:

```php
use TailwindPHP\tw;

// Cache to the default directory: sys_get_temp_dir() . '/tailwindphp'
$css = tw::generate([
    'content' => '<div class="flex p-4">Hello</div>',
    'cache' => true,
]);

// Cache to a custom directory
$css = tw::generate([
    'content' => '<div class="flex p-4">Hello</div>',
    'cache' => '/path/to/cache',
]);

// With a time-to-live (seconds)
$css = tw::generate([
    'content' => '<div class="flex p-4">Hello</div>',
    'cache' => true,
    'cacheTtl' => 3600, // expire after 1 hour
]);
```

The cache directory is created automatically if it doesn't exist.

### Cache key

The key is derived from the **content**, the **CSS configuration**, and the **minify** flag — hashed into the filename `tailwind_<hash>.css`. Any change to the markup, the CSS input, or whether minification is on produces a different key, and therefore a different file.

The CSS configuration in the key is the inline `css` plus the contents of the files named in `importPaths`. Two inputs are not part of it: files pulled in by a nested `@import` inside those files, and the TailwindPHP version. Clear the cache after editing a nested import or upgrading the package, or the old output keeps being served.

### Time-to-live

`cacheTtl` is a lifetime in seconds. On a cache hit, the file's modification time is compared against the current time; if the file is older than `cacheTtl`, it is treated as a miss and recompiled. With no `cacheTtl`, entries never expire — clear them explicitly.

### Clearing the cache

`tw::clearCache()` (or the `clearCache()` function) removes the `tailwind_*.css` files from a cache directory and returns the number of files deleted.

```php
use TailwindPHP\tw;
use function TailwindPHP\clearCache;

$deleted = tw::clearCache();                  // default directory
$deleted = tw::clearCache('/path/to/cache');  // custom directory
clearCache('/path/to/cache');                 // function form
```

## Compiler state cache

The output cache only helps when the same content comes back. When the content changes on every call, the expensive part is building the compiler itself: resolving `@import "tailwindcss"`, parsing the bundled resources, and accumulating the theme. That phase depends only on the input CSS, so it can be stored and reused.

Pass `stateCacheFile` to `tw::compile()` (or `new TailwindCompiler($css, $options)`):

```php
use TailwindPHP\tw;

$compiler = tw::compile($themeCss, [
    'stateCacheFile' => __DIR__ . '/cache/tailwind-state.php',
]);

$css = $compiler->generateExact($html, true);
```

On the first construction the state is written to that path as a plain PHP file, which OPcache can share across requests; later constructions load it instead of parsing again. The output is byte-identical to an uncached compiler.

- The file is validated against an engine fingerprint (the size and mtime of TailwindPHP's sources and resources), a key derived from the input CSS and the `base` and `importSearchPaths` options, and the size and mtime of every file the input imported. A mismatch rebuilds and rewrites it, so upgrading TailwindPHP or editing an imported file needs no manual step.
- You own the path: use one file per distinct input CSS, in a directory the web server can write to. Writes are atomic (a temporary file plus `rename()`).
- Inputs that use a custom `importResolver` bypass the cache, because the resolver's behavior cannot be fingerprinted.
- The same cache is available around the lower-level `compile()` array API as `TailwindPHP\StateCache\compileCssCached($css, $cacheFile, $options)`.

`tw::generate()` does not take `stateCacheFile`; it builds a fresh compiler on every call. Use a compiler instance when construction cost matters.

## Minification

Minification shrinks the output for production. The `minify` flag emits minified CSS directly during serialization, so it is both the fastest and the most precise path; `tw::minify()` runs the string-based minifier (`src/_tailwindphp/CssMinifier.php`) over an existing CSS string:

```php
use TailwindPHP\tw;

// Minify during generation (serializer path, preferred)
$css = tw::generate([
    'content' => '<div class="flex p-4">Hello</div>',
    'minify' => true,
]);

// Or minify an existing string (string-based post-pass)
$css = tw::generate('<div class="flex p-4">Hello</div>');
$minified = tw::minify($css);
```

The two paths produce equivalent structure but not identical bytes. The serializer path preserves descendant `:not()` selectors that the string pass collapses, so prefer the `minify` flag for generated output and reserve `tw::minify()` for CSS that arrives as a string.

### What it does

Both paths apply the same set of size reductions:

| Step | Effect |
|------|--------|
| Remove comments | Strips `/* … */` blocks |
| Collapse whitespace | Collapses runs of whitespace and removes it around `{ } ; : ,` and selector combinators |
| Shorten hex colors | `#ffffff` → `#fff`, `#aabbcc` → `#abc` |
| Remove zero units | `0px` → `0` (preserves `0s`/`0ms` time values) |
| Shorten font-weight | `font-weight:normal` → `400`, `font-weight:bold` → `700` |
| Remove empty rules | Drops selectors with empty declaration blocks |

By design it does **not** merge duplicate selectors or combine shorthand properties — both make debugging harder and can affect the cascade.

### CLI: `--minify` vs `--optimize`

The [CLI](/docs/cli) exposes the serializer minify path through two flags:

```bash
# Optimize and minify (smallest output)
tailwindphp -i ./src/app.css -o ./dist/styles.css --minify   # or -m

# Optimize without minifying
tailwindphp -i ./src/app.css -o ./dist/styles.css --optimize
```

`--optimize` keeps readable output, including in watch mode. `--minify` additionally removes whitespace through the serializer. The lightningcss-equivalent transforms run on every build, so plain output (no flag) is also optimized and readable.

For the rest of the public API — `tw::generate()`, `tw::compile()`, inspection methods, and input formats — see the [API reference](/docs/api).
