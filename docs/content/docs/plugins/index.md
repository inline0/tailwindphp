---
title: "Overview"
description: "Load the official typography and forms plugins with the @plugin directive, pass options via CSS blocks, and register your own PHP plugin classes."
path: "plugins"
order: 9
section: "Plugins"
meta_title: "Overview"
meta_description: "Load the official typography and forms plugins with the @plugin directive, pass options via CSS blocks, and register your own PHP plugin classes."
---

# Plugins

TailwindPHP ships PHP ports of the official TailwindCSS plugins and exposes a native PHP plugin API. Plugins register utilities, components, and variants; they are loaded with the `@plugin` directive in your input CSS. The built-in plugins are 1:1 ports of their JavaScript counterparts — same selectors and output — implemented in PHP rather than executed through Node.

## Using `@plugin`

Reference a plugin by name with `@plugin`. Built-in plugins use their npm package name. Pair the directive with `@import "tailwindcss/utilities.css";` so the plugin's classes are emitted into the utilities layer:

```php
use TailwindPHP\tw;

$css = tw::generate([
    'content' => '<article class="prose prose-lg"><h1>Hello</h1><p>Content here</p></article>',
    'css' => '
        @plugin "@tailwindcss/typography";
        @import "tailwindcss/utilities.css";
    ',
]);
```

Multiple plugins can be loaded together, and order is independent:

```css
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms";
@import "tailwindcss/utilities.css";
```

`@plugin` cannot be nested inside another at-rule (such as `@media`), and an unregistered plugin name throws.

## Plugin options

Pass options to a plugin using CSS block syntax after the name. Keys map to the plugin's option array:

```css
@plugin "@tailwindcss/forms" {
    strategy: "class";
}

@plugin "@tailwindcss/typography" {
    className: "markdown";
}
```

The `@tailwindcss/forms` plugin accepts `strategy` (`base` or `class`); `@tailwindcss/typography` accepts `className` to rename the generated `prose` class. See the per-plugin pages for the full option list.

## Built-in plugins

| Plugin | Description |
|--------|-------------|
| `@tailwindcss/typography` | The `prose` classes — typographic defaults for rich text. See [Typography](/docs/plugins/typography). |
| `@tailwindcss/forms` | Resettable, stylable form controls. See [Forms](/docs/plugins/forms). |

## Custom plugins

Write your own plugin by implementing `PluginInterface` and using the methods on `PluginAPI` (`addUtilities`, `matchUtilities`, `addComponents`, `addVariant`, `theme`, and more). Register it with `registerPlugin(new MyPlugin())` so the name returned by `getName()` resolves in a `@plugin "my-plugin"` directive:

```php
use function TailwindPHP\registerPlugin;

registerPlugin(new MyCustomPlugin());
```

See [Custom Plugins](/docs/plugins/custom) for the interface, a full example, and the complete `PluginAPI` method reference.
