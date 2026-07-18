---
title: "Custom Plugins"
description: "Write your own plugin by implementing PluginInterface and using the PluginAPI to register utilities, components, and variants, then load it with @plugin."
path: "plugins/custom"
order: 130
section: "Plugins"
meta_title: "Custom Plugins"
meta_description: "Write your own plugin by implementing PluginInterface and using the PluginAPI to register utilities, components, and variants, then load it with @plugin."
---

# Custom Plugins

A custom plugin is a PHP class implementing `TailwindPHP\Plugin\PluginInterface`. It receives a `PluginAPI` instance and uses it to register static and functional utilities, components, and variants. Once registered with `registerPlugin()`, the plugin resolves by name in a `@plugin` directive — the same mechanism the built-in typography and forms plugins use.

## `PluginInterface`

Implement three methods:

```php
namespace TailwindPHP\Plugin;

interface PluginInterface
{
    public function getName(): string;
    public function __invoke(PluginAPI $api, array $options = []): void;
    public function getThemeExtensions(array $options = []): array;
}
```

- `getName()` returns the identifier used in `@plugin "..."`.
- `__invoke()` runs the plugin, registering everything through `$api`. The `$options` array carries the values from the `@plugin` CSS block.
- `getThemeExtensions()` returns theme namespaces to merge before utilities are generated (return `[]` if none).

## Example

```php
use TailwindPHP\Plugin\PluginInterface;
use TailwindPHP\Plugin\PluginAPI;

class MyCustomPlugin implements PluginInterface
{
    public function getName(): string
    {
        return 'my-custom-plugin';
    }

    public function __invoke(PluginAPI $api, array $options = []): void
    {
        // Static utilities
        $api->addUtilities([
            '.btn' => [
                'padding' => '0.5rem 1rem',
                'border-radius' => '0.25rem',
                'font-weight' => '600',
            ],
            '.btn-primary' => [
                'background-color' => 'blue',
                'color' => 'white',
            ],
        ]);

        // Functional utilities (generates .tab-1, .tab-2, .tab-4, .tab-8)
        $api->matchUtilities(
            [
                'tab' => fn ($value) => ['tab-size' => $value],
            ],
            ['values' => ['1' => '1', '2' => '2', '4' => '4', '8' => '8']]
        );

        // Component classes (sorted into the components layer)
        $api->addComponents([
            '.card' => [
                'background-color' => 'white',
                'border-radius' => '0.5rem',
                'padding' => '1rem',
            ],
        ]);

        // Custom variant
        $api->addVariant('hocus', '&:hover, &:focus');

        // Read a theme value
        $primary = $api->theme('colors.blue.500', '#3b82f6');
    }

    public function getThemeExtensions(array $options = []): array
    {
        return []; // Return theme additions if needed
    }
}
```

## `PluginAPI` reference

The API mirrors the TailwindCSS plugin API:

| Method | Signature | Purpose |
|--------|-----------|---------|
| `addBase` | `addBase(array $css): void` | Add base-layer styles. |
| `addUtilities` | `addUtilities(array $utilities, array $options = []): void` | Register static utility classes keyed by selector. |
| `matchUtilities` | `matchUtilities(array $utilities, array $options = []): void` | Register functional utilities; `$options['values']` supplies the value map, `$options['supportsNegativeValues']` enables negatives. |
| `addComponents` | `addComponents(array $components, array $options = []): void` | Register component classes (components layer). |
| `matchComponents` | `matchComponents(array $components, array $options = []): void` | Register functional components with a value map. |
| `addVariant` | `addVariant(string $name, string\|array $variant): void` | Register a static variant from a selector. |
| `matchVariant` | `matchVariant(string $name, callable $callback, array $options = []): void` | Register a functional variant; `$options['values']` supplies the value map. |
| `theme` | `theme(string $path, mixed $defaultValue = null): mixed` | Read a theme value by dot path (e.g. `colors.blue.500`). |
| `config` | `config(?string $path = null, mixed $defaultValue = null): mixed` | Read a config value by dot path, or the whole config when `$path` is null. |
| `prefix` | `prefix(string $className): string` | Apply the configured prefix to a class name. |

The callback passed to `matchUtilities`, `matchComponents`, and `matchVariant` receives the value and a second argument array containing a `modifier` key.

## Registering and using

Register the plugin instance, then reference it by the name from `getName()`:

```php
use TailwindPHP\tw;
use function TailwindPHP\registerPlugin;

registerPlugin(new MyCustomPlugin());

$css = tw::generate(
    '<div class="btn btn-primary card tab-4">…</div>',
    '@plugin "my-custom-plugin"; @import "tailwindcss/utilities.css";'
);
```

See [Plugins](/docs/plugins) for the `@plugin` directive, and [Theme](/docs/usage/theme) for the values exposed through `$api->theme()`.
