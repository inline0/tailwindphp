---
title: "API"
description: "The full TailwindPHP\\tw static API — generate, compile, properties, computed values, theme inspectors, caching — plus the reusable TailwindCompiler instance."
path: "api"
order: 190
section: "Reference"
meta_title: "API"
meta_description: "The full TailwindPHP\\tw static API — generate, compile, properties, computed values, theme inspectors, caching — plus the reusable TailwindCompiler instance."
---

# API

The entire static surface lives on one class: `TailwindPHP\tw` (an alias of the internal `Tailwind` class). Every method is callable statically, and the inspection methods (`properties`, `computedProperties`, `value`, `computedValue`) all accept the [input formats](#input-formats) described at the bottom of this page.

For repeated work against the same CSS configuration, call [`tw::compile()`](#twcompile) once and reuse the returned [`TailwindCompiler`](#tailwindcompiler-instance-methods).

```php
use TailwindPHP\tw;

$css = tw::generate('<div class="flex items-center p-4 bg-blue-500">');
```

## tw::generate()

```php
public static function generate(string|array $input, string $css = '@import "tailwindcss";'): string
```

Parses content, extracts class candidates, and returns the generated CSS. The default `$css` is `@import "tailwindcss";`, which pulls in theme, preflight, and utilities. **Returns** `string`.

```php
use TailwindPHP\tw;

// String input
$css = tw::generate('<div class="flex p-4">');

// String with custom CSS
$css = tw::generate('<div class="flex bg-brand">', '@import "tailwindcss"; @theme { --color-brand: #3b82f6; }');

// Array input with options
$css = tw::generate([
    'content' => '<div class="flex p-4">',
    'css' => '@import "tailwindcss";',
    'minify' => true,
]);
```

The array form accepts these keys:

| Key | Type | Purpose |
|---|---|---|
| `content` | `string` | Content to scan for class candidates (required) |
| `css` | `string` | Input CSS with Tailwind directives (default `@import "tailwindcss";`) |
| `minify` | `bool` | Minify the output (default `false`) |
| `importPaths` | `string \| array \| callable \| null` | Load CSS from the filesystem with full `@import` resolution — see [Importing CSS](/docs/usage/imports) |
| `cache` | `bool \| string` | Enable file caching — see [Caching](#caching) |
| `cacheTtl` | `int` | Cache lifetime in seconds |

## tw::compile()

```php
public static function compile(string $css = '@import "tailwindcss";', array $options = []): TailwindCompiler
```

Creates a reusable `TailwindCompiler` bound to the given CSS. Parsing and design-system construction happen once, so this is the efficient choice when generating CSS for many different content strings. Use `generate()` to accumulate one stylesheet across calls, or [`generateExact()`](#accumulating-vs-exact-generation) for independent per-page output. **Returns** `TailwindCompiler`.

```php
use TailwindPHP\tw;

// Default Tailwind
$compiler = tw::compile();

// Custom CSS
$compiler = tw::compile('@import "tailwindcss"; @theme { --color-brand: #3b82f6; }');

$css = $compiler->generate('<div class="flex p-4 bg-brand">');
```

The `$options` array accepts:

| Option | Type | Purpose |
|---|---|---|
| `stateCacheFile` | `string` | Path of a PHP file that persists the compiler's construction state across requests and processes — see [Compiler state cache](/docs/advanced/caching#compiler-state-cache) |
| `polyfills` | `int` | Which fallbacks to emit, as a bitmask of `TailwindPHP\POLYFILL_AT_PROPERTY` (the `@layer properties` defaults for `@property` variables) and `TailwindPHP\POLYFILL_COLOR_MIX` (static color fallbacks before `color-mix()`). Default `POLYFILL_ALL`; `POLYFILL_NONE` disables both |
| `importSearchPaths` | `array<string>` | Directories to search when resolving `@import` from the filesystem |

```php
use TailwindPHP\tw;
use const TailwindPHP\POLYFILL_NONE;

// Cache construction state on disk, reused by later requests
$compiler = tw::compile('@import "tailwindcss";', [
    'stateCacheFile' => __DIR__ . '/cache/tailwind-state.php',
]);

// Plain output without fallbacks, e.g. for CSS modules
$compiler = tw::compile('@import "tailwindcss/utilities.css";', [
    'polyfills' => POLYFILL_NONE,
]);
$compiler->generate('<div class="bg-red-500/50">');
// .bg-red-500\/50 { background-color: color-mix(in oklab, var(--color-red-500) 50%, transparent); }
// (with the default, a `#fb2c3680` fallback comes first and color-mix() moves into @supports)
```

See [TailwindCompiler instance methods](#tailwindcompiler-instance-methods) for the full instance surface.

## tw::properties()

```php
public static function properties(string|array $input, string $css = '@import "tailwindcss";'): array
```

Returns the **raw** CSS properties for a class, with CSS variables left unresolved. **Returns** `array<string, string>` (property name → value).

```php
use TailwindPHP\tw;

tw::properties('p-4');
// ['padding' => 'calc(var(--spacing) * 4)']

tw::properties(['flex', 'items-center', 'p-4']);
// ['display' => 'flex', 'align-items' => 'center', 'padding' => 'calc(var(--spacing) * 4)']
```

## tw::computedProperties()

```php
public static function computedProperties(string|array $input, string $css = '@import "tailwindcss";'): array
```

Like [`properties()`](#twproperties), but with every CSS variable resolved to a concrete value. **Returns** `array<string, string>`.

```php
use TailwindPHP\tw;

tw::computedProperties('p-4');
// ['padding' => '1rem']

tw::computedProperties('text-blue-500');
// ['color' => 'oklch(62.3% .214 259.815)']

tw::computedProperties(['flex', 'items-center', 'gap-4']);
// ['display' => 'flex', 'align-items' => 'center', 'gap' => '1rem']
```

## tw::value()

```php
public static function value(string|array $input, string $css = '@import "tailwindcss";'): ?string
```

Returns the **raw** value for a single utility class. **Returns** `?string` — `null` if the utility is not found.

```php
use TailwindPHP\tw;

tw::value('p-4');           // 'calc(var(--spacing) * 4)'
tw::value('text-blue-500'); // 'var(--color-blue-500)'
```

## tw::computedValue()

```php
public static function computedValue(string|array $input, string $css = '@import "tailwindcss";'): ?string
```

Returns the **resolved** value for a single utility class. **Returns** `?string` — `null` if the utility is not found.

```php
use TailwindPHP\tw;

tw::computedValue('p-4');           // '1rem'
tw::computedValue('text-blue-500'); // 'oklch(62.3% .214 259.815)'
tw::computedValue('gap-4');         // '1rem'
```

## tw::extractCandidates()

```php
public static function extractCandidates(string $html): array
```

Extracts Tailwind class names from content (reads both `class` and `className` attributes). **Returns** `array<string>`.

```php
use TailwindPHP\tw;

tw::extractCandidates('<div class="flex p-4" className="bg-blue-500">');
// ['flex', 'p-4', 'bg-blue-500']
```

## tw::extractCandidatesFromStrings()

```php
public static function extractCandidatesFromStrings(string $source): array
```

Extracts class-name candidates from every single- or double-quoted string in source code, for templates that build class lists in variables instead of `class` attributes. Each string is split on whitespace and every token that looks like a class name is kept. **Returns** `array<string>`.

```php
use TailwindPHP\tw;

$classes = tw::extractCandidatesFromStrings('<?php $wrap = \'p-4 sm:flex\'; $title = "hello world"; ?>');
// ['p-4', 'sm:flex', 'hello', 'world']

$css = tw::compile()->css($classes);
```

Plain words pass the check too (`hello`, `world` above); they compile to nothing unless they happen to be utility names. Pass the result to [`css()`](#tailwindcompiler-instance-methods), since `generate()` reads only `class` attributes.

## tw::cssMap()

```php
public static function cssMap(string $css = '@import "tailwindcss";'): array
```

Builds a reverse map from CSS declarations to utility classes, useful for converting existing CSS to Tailwind classes. Keys are `"property: value"` strings with variables resolved (multi-property utilities also get a `"prop: value; prop: value"` key), values are class names. **Returns** `array<string, string>`.

```php
use TailwindPHP\tw;

$map = tw::cssMap();
$map['display: flex'];       // 'flex'
$map['padding: 1rem'];       // 'p-4'
$map['text-align: center'];  // 'text-center'
$map['color: #fff'];         // 'text-white'
```

The map covers a fixed list of common utilities (display, position, flexbox, typography, spacing and sizing steps, borders, the black/white/transparent colors, and similar), not every utility or theme color. The `$css` argument changes the resolved values of those utilities, but custom theme tokens (such as `--color-brand`) do not add entries.

## tw::minify()

```php
public static function minify(string $css): string
```

Minifies an arbitrary CSS string: removes comments, collapses whitespace, shortens hex colors (`#ffffff` → `#fff`), drops units from zero values (`0px` → `0`), and more. **Returns** `string`.

For CSS that TailwindPHP generates itself, prefer the `minify` option (`tw::generate(['minify' => true])`) or the `$minify` parameter on the [compiler methods](#tailwindcompiler-instance-methods). That path minifies during serialization, which is faster and preserves descendant `:not()` selectors that the string-based pass collapses.

```php
use TailwindPHP\tw;

$css = tw::generate('<div class="flex p-4">');
$minified = tw::minify($css);
```

See [Caching & minification](/docs/advanced/caching) for the full set of optimizations.

## tw::clearCache()

```php
public static function clearCache(string|bool|null $cache = true): int
```

Deletes cached CSS files. Pass `true` (or omit) for the default cache directory, or a path string for a custom directory. **Returns** `int` — the number of files deleted.

```php
use TailwindPHP\tw;

tw::clearCache();                  // default directory
tw::clearCache('/path/to/cache');  // custom directory
```

A standalone `TailwindPHP\clearCache()` function is also available.

## tw::colors()

```php
public static function colors(string $css = '@import "tailwindcss";'): array
```

Returns every color value from the theme. **Returns** `array<string, string>` (color name → computed value).

```php
use TailwindPHP\tw;

tw::colors();
// ['red-500' => 'oklch(63.7% .237 25.331)', 'blue-500' => 'oklch(62.3% .214 259.815)', ...]

// With a custom theme
tw::colors('@import "tailwindcss"; @theme { --color-brand: #3b82f6; }');
// [..., 'brand' => '#3b82f6']
```

## tw::breakpoints()

```php
public static function breakpoints(string $css = '@import "tailwindcss";'): array
```

Returns every breakpoint value from the theme. **Returns** `array<string, string>` (breakpoint name → value).

```php
use TailwindPHP\tw;

tw::breakpoints();
// ['sm' => '40rem', 'md' => '48rem', 'lg' => '64rem', 'xl' => '80rem', '2xl' => '96rem']

tw::breakpoints('@import "tailwindcss"; @theme { --breakpoint-xs: 20rem; }');
// ['sm' => '40rem', ..., '2xl' => '96rem', 'xs' => '20rem']
```

## tw::spacing()

```php
public static function spacing(string $css = '@import "tailwindcss";'): array
```

Returns custom spacing values from the theme. **Returns** `array<string, string>` (spacing name → value).

```php
use TailwindPHP\tw;

// TailwindCSS 4 uses a single --spacing base value rather than a --spacing-* namespace.
// This returns any custom --spacing-* values defined in the theme.
tw::spacing('@import "tailwindcss"; @theme { --spacing-huge: 10rem; }');
// ['huge' => '10rem']
```

## Input formats

The inspection methods (`generate`, `properties`, `computedProperties`, `value`, `computedValue`) accept three input forms:

| Format | Example |
|---|---|
| String only | `tw::generate('<div class="flex">')` |
| String + CSS string | `tw::generate('<div class="flex">', '@import "tailwindcss"; @theme { ... }')` |
| Array with `content` (+ optional `css`) | `tw::generate(['content' => '<div class="flex">', 'css' => '@import "tailwindcss";'])` |

```php
use TailwindPHP\tw;

// Format 1: string only
tw::properties('p-4');

// Format 2: string + CSS
tw::properties('bg-brand', '@import "tailwindcss"; @theme { --color-brand: #3b82f6; }');

// Format 3: array
tw::properties(['content' => 'p-4', 'css' => '@import "tailwindcss";']);
```

## TailwindCompiler instance methods

The object returned by [`tw::compile()`](#twcompile) exposes the same inspection surface as the static class, bound to the CSS it was compiled with. Use it to avoid re-parsing the theme on every call.

```php
public function generate(string $content, bool $minify = false): string
public function css(array $candidates, bool $minify = false): string
public function generateExact(string $content, bool $minify = false): string
public function cssExact(array $candidates, bool $minify = false): string
public function extractCandidates(string $html): array
public function extractCandidatesFromStrings(string $source): array
public function properties(string|array $utilities): array
public function computedProperties(string|array $utilities): array
public function value(string $utility): ?string
public function computedValue(string $utility): ?string
public function minify(string $css): string
public function colors(): array
public function breakpoints(): array
public function spacing(): array
```

```php
use TailwindPHP\tw;

$compiler = tw::compile('@import "tailwindcss"; @theme { --color-brand: #3b82f6; }');

$css        = $compiler->generate('<div class="flex p-4 bg-brand">');
$candidates = $compiler->extractCandidates('<div class="flex p-4 bg-brand">');

$compiler->properties('bg-brand');          // ['background-color' => 'var(--color-brand)']
$compiler->computedProperties('bg-brand');   // ['background-color' => '#3b82f6']
$compiler->value('bg-brand');                // 'var(--color-brand)'
$compiler->computedValue('bg-brand');        // '#3b82f6'

$minified = $compiler->minify($css);

$compiler->colors();        // all color values
$compiler->breakpoints();   // all breakpoint values
$compiler->spacing();       // custom spacing values
```

### Accumulating vs. exact generation

`generate()` and `css()` **accumulate**: every call adds its candidates to the compiler's growing set, and the returned stylesheet covers everything seen so far. That fits a single stylesheet built up across templates.

`generateExact()` and `cssExact()` compile **exactly** the given content or candidates per call, with no carry-over between calls, while still reusing the compiler's parsed design system. The output matches what a cold `tw::generate()` of the same content would produce. This is the fastest way to build per-page CSS from one long-lived compiler:

```php
use TailwindPHP\tw;

$compiler = tw::compile($themeCss);

foreach ($pages as $slug => $html) {
    $perPageCss[$slug] = $compiler->generateExact($html, true);
}
```

All four methods accept an optional `$minify` flag that emits minified CSS during serialization, byte-identical to `tw::generate(['minify' => true])` and cheaper than minifying the pretty output afterwards.

### Advanced inspectors

For introspecting the compiled state directly:

```php
public function getTheme(): Theme
public function getDesignSystem(): object
public function getCompiled(): array
```

```php
$compiler->getTheme();        // Theme object with resolved values
$compiler->getDesignSystem(); // Design system: utilities, variants, etc.
$compiler->getCompiled();     // Raw compiled state array
```

These return internal structures; see [Architecture](/docs/advanced/architecture) for what they contain.

### Lower-level functions

The `tw` class wraps a set of namespaced functions in `TailwindPHP`. They are useful when you need the raw compile result rather than a `TailwindCompiler`:

| Function | Purpose |
|---|---|
| `compile(string $css, array $options = []): array` | Parses and compiles CSS. Returns `build` (accumulating) and `buildExact` closures that take candidates and an optional `$minify` flag, plus `sources`, `root`, `features`, and `designSystem`. Accepts the same options as [`tw::compile()`](#twcompile) except `stateCacheFile` |
| `StateCache\compileCssCached(string $css, string $cacheFile, array $options = []): array` | `compile()` with the persistent [compiler state cache](/docs/advanced/caching#compiler-state-cache) |
| `parseCssState()`, `finalizeCssState()`, `compileParsed()` | The two halves of parsing (a serializable state, then the closures rebuilt from it) and the final assembly step that `compileCssCached()` uses. `parseCss()` and `compileAst()` remain the one-step equivalents |

```php
use function TailwindPHP\compile;

$compiled = compile('@import "tailwindcss";');
$css = $compiled['build'](['flex', 'p-4'], true); // minified
```

## Caching

`tw::generate()` can cache compiled CSS to disk so identical inputs skip recompilation.

| Option | Type | Default | Purpose |
|---|---|---|---|
| `cache` | `bool \| string` | `false` | `true` enables the default directory; a path string caches there |
| `cacheTtl` | `int` | none | Cache lifetime in seconds; expired entries are recompiled |

```php
use TailwindPHP\tw;

// Default directory: sys_get_temp_dir() . '/tailwindphp'
$css = tw::generate([
    'content' => '<div class="flex p-4">',
    'cache' => true,
]);

// Custom directory + TTL
$css = tw::generate([
    'content' => '<div class="flex p-4">',
    'cache' => '/path/to/cache',
    'cacheTtl' => 3600, // expire after 1 hour
]);
```

The cache key is derived from the **content**, the **CSS configuration**, and the **minify** option, so different inputs produce different cache files. Clear entries with [`tw::clearCache()`](#twclearcache) or the standalone `TailwindPHP\clearCache()` function.

For the deeper guide, see [Caching & minification](/docs/advanced/caching).
