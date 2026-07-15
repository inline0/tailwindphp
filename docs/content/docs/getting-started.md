---
title: "Getting Started"
description: "Install TailwindPHP with Composer and generate your first Tailwind CSS from PHP — no Node.js, no build step, no config file."
path: "getting-started"
order: 1
section: "Documentation"
meta_title: "Getting Started"
meta_description: "Install TailwindPHP with Composer and generate your first Tailwind CSS from PHP — no Node.js, no build step, no config file."
---

# Getting Started

## Install

```bash
composer require tailwindphp/tailwindphp
```

TailwindPHP needs PHP 8.2 or later and Composer. There is no Node.js dependency, no build step, and no npm in your Docker image or CI. Just `composer require` and call the API.

## Generate your first CSS

```php
<?php

require __DIR__ . '/vendor/autoload.php';

use TailwindPHP\tw;

$css = tw::generate('<div class="flex items-center p-4 bg-blue-500">Hello</div>');
```

`generate()` scans the markup, extracts the class names it finds, and emits only the CSS those classes need — nothing more. With no second argument it uses a default `@import "tailwindcss"`, which pulls in the theme, [Preflight](/docs/usage/imports), and the utilities layer.

## Customize via a CSS string

Pass an input CSS string as the second argument to add `@theme` variables, custom rules, or directives. New theme values become utilities automatically:

```php
use TailwindPHP\tw;

$css = tw::generate(
    '<div class="bg-brand p-4">Hello</div>',
    '@import "tailwindcss"; @theme { --color-brand: #3b82f6; }'
);
// .bg-brand now resolves to var(--color-brand)
```

See [Theme](/docs/usage/theme) for the full set of theme namespaces.

## Array input

For anything beyond a one-liner, pass an array with `content` and `css` keys. This is the place to define components with `@apply`:

```php
use TailwindPHP\tw;

$css = tw::generate([
    'content' => '<div class="flex p-4 btn">Hello</div>',
    'css' => '
        @import "tailwindcss";

        @theme {
            --color-brand: #3b82f6;
            --font-heading: "Inter", sans-serif;
        }

        .btn {
            @apply px-4 py-2 rounded-lg bg-brand text-white;
        }
    ',
]);
```

The array form also accepts `minify`, `importPaths`, `cache`, and `cacheTtl`. See [Usage](/docs/usage) for the input formats and [Directives](/docs/usage/directives) for `@apply`, `@theme`, `@utility`, and friends.

## Write to a file

`generate()` returns a string, so writing a stylesheet is a one-liner:

```php
use TailwindPHP\tw;

file_put_contents('dist/styles.css', tw::generate([
    'content' => file_get_contents('templates/page.html'),
    'css' => '@import "tailwindcss";',
]));
```

For file-based builds, content scanning via `@source`, and watch mode, use the [CLI](/docs/cli) instead — it is a 1:1 port of `@tailwindcss/cli`.

## Minify for production

Pass `minify => true` to compress the output during generation, or call `tw::minify()` on an existing string:

```php
use TailwindPHP\tw;

// Minify during generation
$css = tw::generate([
    'content' => '<div class="flex p-4">Hello</div>',
    'minify' => true,
]);

// Or minify separately
$css = tw::generate('<div class="flex p-4">Hello</div>');
$minified = tw::minify($css);
```

The minifier removes comments, collapses whitespace, shortens hex colors (`#ffffff` to `#fff`), and strips units from zero values (`0px` to `0`). See [Caching & minification](/docs/advanced/caching) for caching options.

## Next steps

- [Usage](/docs/usage) — the generate workflow, content scanning, and input formats.
- [Class utilities](/docs/class-utilities) — `cn()`, `merge()`, `join()`, and `variants()`.
- [Plugins](/docs/plugins) — typography, forms, and custom plugins.
- [API](/docs/api) — the full `tw` surface and reusable compiler instances.
- [CLI](/docs/cli) — file-based and watch builds without Node.js.
