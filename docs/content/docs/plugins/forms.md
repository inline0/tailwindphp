---
title: "Forms Plugin"
description: "The @tailwindcss/forms port resets native form controls to a consistent baseline so inputs, selects, checkboxes, and radios are easy to style with utilities."
path: "plugins/forms"
order: 11
section: "Plugins"
meta_title: "Forms Plugin"
meta_description: "The @tailwindcss/forms port resets native form controls to a consistent baseline so inputs, selects, checkboxes, and radios are easy to style with utilities."
---

# Forms Plugin

`@tailwindcss/forms` is a 1:1 PHP port of the official forms plugin. It provides an opinionated reset for form controls — text inputs, textareas, selects, checkboxes, and radios — bringing them to a consistent baseline (appearance reset, border, padding, focus ring, custom select chevron and checkbox/radio icons) that you can then override with utilities.

## Usage

Load the plugin with `@plugin` and import the utilities layer:

```php
use TailwindPHP\tw;

$css = tw::generate(
    '<input class="form-input"><select class="form-select"></select>',
    '@plugin "@tailwindcss/forms"; @import "tailwindcss/utilities.css";'
);
```

## Strategy

The `strategy` option controls how styles are applied:

| Strategy | Behavior |
|----------|----------|
| `base` | Styles native form elements globally via selectors like `[type='text']`, `textarea`, and `select`. |
| `class` | Styles only the explicit `form-*` classes, leaving unclassed elements untouched. |

When `strategy` is omitted, **both** strategies are applied — native elements get the baseline reset and the `form-*` classes are available too. Set a single strategy to opt out of the other:

```css
@plugin "@tailwindcss/forms" {
    strategy: "class";
}
```

## Class strategy

With the `class` strategy (or the default), apply these classes explicitly to the elements you want to style:

| Class | Element |
|-------|---------|
| `form-input` | Text-like inputs |
| `form-textarea` | `<textarea>` |
| `form-select` | `<select>` |
| `form-multiselect` | `<select multiple>` |
| `form-checkbox` | `<input type="checkbox">` |
| `form-radio` | `<input type="radio">` |

```php
$css = tw::generate(
    '
        <input class="form-input">
        <textarea class="form-textarea"></textarea>
        <select class="form-select"></select>
        <select class="form-multiselect" multiple></select>
        <input type="checkbox" class="form-checkbox">
        <input type="radio" class="form-radio">
    ',
    '
        @plugin "@tailwindcss/forms" {
            strategy: "class";
        }
        @import "tailwindcss/utilities.css";
    '
);
```

Each class resets the control's appearance and sets borders, padding, and a focus ring; `form-select` adds a chevron background image, and `form-checkbox`/`form-radio` add checked-state icons. Override any of it with regular utilities (for example `class="form-input rounded-lg border-gray-300"`).

See [Plugins](/docs/plugins) for the `@plugin` directive and loading details.
