---
title: "The @source Directive"
description: "Use @source in your input CSS to control which template files are scanned for class names and which candidates are forced in or excluded."
path: "usage/source"
order: 6
section: "Usage"
meta_title: "The @source Directive"
meta_description: "Use @source in your input CSS to control which template files are scanned for class names and which candidates are forced in or excluded."
---

# The @source Directive

`@source` lives in your input CSS and tells TailwindPHP where to find the template files it should scan for class names. It is primarily used with the [CLI](/docs/cli), where a single input CSS file drives a build over a content directory.

```css
@import "tailwindcss";
@source "./templates";
```

`@source` directives are read during compilation and removed from the output — they never appear in the generated CSS. Paths must be quoted, and both single and double quotes are accepted.

## Directories

Point `@source` at a directory to scan every supported file inside it:

```css
@source "./templates";
```

## Glob patterns

Narrow the scan with a glob:

```css
@source "./src/**/*.php";
```

## Multiple sources

Add as many `@source` directives as you need; they accumulate:

```css
@source "./templates";
@source "./components/**/*.php";
```

## Negated patterns

Prefix a path with `not` to exclude it from scanning:

```css
@source "./src";
@source not "./src/legacy";
```

## Inline candidates

`@source inline(...)` forces classes into the output even when they never appear in scanned files — useful for class names assembled dynamically at runtime:

```css
@source inline("flex p-4 m-2");
```

Inline candidates support variants too:

```css
@source inline("hover:bg-blue-500 focus:ring-2");
```

### Brace expansion

Inline patterns expand brace groups, so you can enumerate many candidates compactly:

```css
@source inline("p-{1,2,4}");
/* Generates p-1, p-2, and p-4 */

@source inline("text-{red,blue}-500");
/* Generates text-red-500 and text-blue-500 */
```

## Ignored inline candidates

`@source not inline(...)` does the opposite of `inline()` — it strips matching candidates from the output even if they were found in your content. Brace expansion works here as well:

```css
@source not inline("legacy");
@source not inline("p-{1,2}");
```

## Validation rules

`@source` is a statement, not a block. The compiler rejects:

- A directive with a body — `@source cannot have a body.`
- A nested directive (inside `@media`, for example) — `@source cannot be nested.`
- An unquoted path — `@source paths must be quoted.`

```css
/* Invalid — throws "`@source` cannot have a body." */
@source "./src" {
    .some-style { color: red; }
}

/* Invalid — throws "`@source` paths must be quoted." */
@source ./src;
```

See the [CLI](/docs/cli) for running source-driven builds, and [Imports](/docs/usage/imports) for resolving `@import` and virtual modules.
