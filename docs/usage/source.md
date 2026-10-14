---
title: "The @source Directive"
description: "Use @source in your input CSS to control which template files are scanned for class names and which candidates are forced in or excluded."
path: "usage/source"
order: 70
section: "Usage"
meta_title: "The @source Directive"
meta_description: "Use @source in your input CSS to control which template files are scanned for class names and which candidates are forced in or excluded."
---

# The @source Directive

`@source` lives in your input CSS. Its `inline()` forms add or remove class candidates and work everywhere. Its path forms name the template files to scan for class names; only the [CLI](/docs/cli) scans files, and it does not yet apply the paths you give it (see [How paths are used](#how-paths-are-used)).

```css
@import "tailwindcss";
@source "./templates";
```

`@source` directives are read during compilation and removed from the output — they never appear in the generated CSS. Paths must be quoted, and both single and double quotes are accepted.

## Paths, globs, and negation

The path form accepts a directory, a glob, or a negated path, and the directives accumulate:

```css
@source "./templates";              /* a directory */
@source "./components/**/*.php";    /* a glob */
@source not "./templates/legacy";   /* an exclusion */
```

### How paths are used

The compiler records every path directive in the `sources` list of the array that `TailwindPHP\compile()` returns, as `['base' => …, 'pattern' => …, 'negated' => …]` with `base` taken from the `base` compile option. It never reads files itself.

- `tw::generate()`, `tw::compile()`, and `TailwindCompiler` compile only the content you pass in. Path directives have no effect there.
- The [CLI](/docs/cli) reads `sources`, but in the current release it scans the input file's directory recursively for every non-negated path, whatever the path or glob says, and skips `not` paths entirely, so they exclude nothing ([#8](https://github.com/inline0/tailwindphp/issues/8)). [What the CLI scans](/docs/cli#what-the-cli-scans) has the details and a layout that works today.

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

See the [CLI](/docs/cli) for file-based builds, and [Imports](/docs/usage/imports) for resolving `@import` and virtual modules.
