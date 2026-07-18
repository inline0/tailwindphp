---
title: "Variants"
description: "variants() and compose() — a PHP port of CVA (Class Variance Authority) for declarative, multi-axis component styles built on base, variants, compoundVariants, and defaults."
path: "class-utilities/variants"
order: 90
section: "Class Utilities"
meta_title: "Variants"
meta_description: "variants() and compose() — a PHP port of CVA (Class Variance Authority) for declarative, multi-axis component styles built on base, variants, compoundVariants, and defaults."
---

# Variants

`variants()` is a PHP port of [CVA (Class Variance Authority)](https://github.com/joe-bell/cva). It turns a declarative config — a base, named variant axes, and defaults — into a callable that maps props to a class string. Use it when a component has style dimensions like size and intent that combine.

```php
use function TailwindPHP\variants;

$button = variants([
    'base' => 'btn font-semibold border rounded',
    'variants' => [
        'intent' => [
            'primary'   => 'bg-blue-500 text-white',
            'secondary' => 'bg-gray-200 text-gray-800',
        ],
        'size' => [
            'sm' => 'text-sm px-2 py-1',
            'md' => 'text-base px-4 py-2',
        ],
    ],
    'defaultVariants' => [
        'intent' => 'primary',
        'size'   => 'md',
    ],
]);

$button();
// => 'btn font-semibold border rounded bg-blue-500 text-white text-base px-4 py-2'
```

`variants()` returns a `callable`; call it with a props array (or nothing) to get the resolved string.

## Config

| Key | Type | Purpose |
|-----|------|---------|
| `base` | `string` | Classes applied to every output. |
| `variants` | `array` | Named axes, each mapping value names to class strings. |
| `compoundVariants` | `array` | Class strings applied only when several variant values combine. |
| `defaultVariants` | `array` | Value per axis used when a prop is omitted. |

All keys are optional. With no `variants`, the result returns `base` plus any custom classes:

```php
$x = variants(['base' => 'box']);
$x();                          // => 'box'
$x(['class' => 'p-4']);        // => 'box p-4'
```

A variant value may map to `null` to contribute nothing — useful as an explicit "unset" option in an axis.

## Calling the result

Pass a single props array, CVA-style. Keys match your variant axis names; omitted axes fall back to `defaultVariants`.

```php
$button(['intent' => 'secondary']);
// => 'btn font-semibold border rounded bg-gray-200 text-gray-800 text-base px-4 py-2'

$button(['size' => 'sm', 'class' => 'mt-4']);
// => 'btn font-semibold border rounded bg-blue-500 text-white text-sm px-2 py-1 mt-4'
```

The `class` key (and its alias `className`) is appended to the end of the output. Appending alone does not resolve conflicts — see the component pattern below for that.

## compoundVariants

Each entry in `compoundVariants` is an array of variant conditions plus a `class` (or `className`) of extra classes. The classes apply only when every condition matches the resolved props (defaults included). A condition value can be a single string or an array of strings to match any of several values.

```php
$button = variants([
    'base' => 'btn',
    'variants' => [
        'intent' => [
            'primary' => 'bg-blue-500',
            'warning' => 'bg-yellow-500',
            'danger'  => 'bg-red-500',
        ],
        'size' => ['sm' => 'text-sm', 'md' => 'text-base'],
    ],
    'compoundVariants' => [
        // Applies only when intent=primary AND size=md
        ['intent' => 'primary', 'size' => 'md', 'class' => 'uppercase'],
        // Applies when intent is warning OR danger
        ['intent' => ['warning', 'danger'], 'class' => '!border-red-500'],
    ],
    'defaultVariants' => ['intent' => 'primary', 'size' => 'md'],
]);

$button();
// => 'btn bg-blue-500 text-base uppercase'

$button(['intent' => 'danger']);
// => 'btn bg-red-500 text-base !border-red-500'
```

## Component pattern

`variants()` only appends `class`; to let callers truly override variant defaults, wrap the output in [cn()](/docs/class-utilities) so conflicts resolve in the caller's favor.

```php
use function TailwindPHP\variants;
use function TailwindPHP\cn;

function Button(array $props = []): string {
    static $styles = null;
    $styles ??= variants([
        'base' => 'inline-flex items-center justify-center rounded-md font-medium',
        'variants' => [
            'variant' => [
                'default' => 'bg-primary text-primary-foreground hover:bg-primary/90',
                'outline' => 'border border-input bg-background hover:bg-accent',
                'ghost'   => 'hover:bg-accent hover:text-accent-foreground',
            ],
            'size' => [
                'default' => 'h-10 px-4 py-2',
                'sm'      => 'h-9 px-3',
                'lg'      => 'h-11 px-8',
            ],
        ],
        'defaultVariants' => ['variant' => 'default', 'size' => 'default'],
    ]);

    // cn() merges variant output with custom classes, resolving conflicts
    $class = cn($styles($props), $props['class'] ?? null);
    $text  = $props['children'] ?? 'Button';
    return "<button class=\"{$class}\">{$text}</button>";
}

// The custom px-8 wins over the variant's px-3 via cn()
Button(['variant' => 'outline', 'size' => 'sm', 'class' => 'mt-4 px-8']);
```

The `static $styles` cache builds the variant config once and reuses it across calls.

## compose()

`compose()` merges several variant components into one. The composed callable forwards each prop to every component, collects their outputs, and appends any `class`/`className`.

```php
use function TailwindPHP\variants;
use function TailwindPHP\compose;

$box   = variants(['variants' => ['shadow' => ['sm' => 'shadow-sm', 'md' => 'shadow-md']]]);
$stack = variants(['variants' => ['gap' => ['1' => 'gap-1', '2' => 'gap-2']]]);
$card  = compose($box, $stack);

$card(['shadow' => 'md', 'gap' => '2']);
// => 'shadow-md gap-2'
```

This keeps reusable axes (spacing, elevation, layout) in separate definitions and combines them per component.

## Imports

```php
use function TailwindPHP\variants;
use function TailwindPHP\compose;
```

Both live in the main `TailwindPHP` namespace and are bundled with the package — a PHP port of CVA by Joe Bell.
