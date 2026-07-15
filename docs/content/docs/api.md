---
title: "API"
description: "The full TailwindPHP\\tw static API — generate, compile, properties, computed values, theme inspectors, caching — plus the reusable TailwindCompiler instance."
path: "api"
order: 18
section: "Documentation"
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

Creates a reusable `TailwindCompiler` bound to the given CSS. Parsing and design-system construction happen once, so this is the efficient choice when generating CSS for many different content strings. **Returns** `TailwindCompiler`.

```php
use TailwindPHP\tw;

// Default Tailwind
$compiler = tw::compile();

// Custom CSS
$compiler = tw::compile('@import "tailwindcss"; @theme { --color-brand: #3b82f6; }');

$css = $compiler->generate('<div class="flex p-4 bg-brand">');
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
// ['color' => 'oklch(.546 .245 262.881)']

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
tw::computedValue('text-blue-500'); // 'oklch(.546 .245 262.881)'
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

## tw::minify()

```php
public static function minify(string $css): string
```

Minifies CSS: removes comments, collapses whitespace, shortens hex colors (`#ffffff` → `#fff`), drops units from zero values (`0px` → `0`), and more. **Returns** `string`.

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
// ['red-500' => 'oklch(63.7% 0.237 25.331)', 'blue-500' => 'oklch(62.3% 0.214 259.815)', ...]

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
// ['xs' => '20rem', 'sm' => '40rem', ...]
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
public function generate(string $content): string
public function extractCandidates(string $html): array
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
