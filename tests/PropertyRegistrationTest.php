<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use TailwindPHP\Tailwind;

/**
 * Regression tests for @property registration of composed --tw-* variable
 * groups (issue #7).
 *
 * Utilities that compose a shorthand out of several --tw-* custom properties
 * must register every member of the group with @property so unset members
 * have an initial value. Without the registration, `translate:
 * var(--tw-translate-x) var(--tw-translate-y)` is invalid at computed-value
 * time when only translate-x-* is present, and the browser silently drops the
 * declaration: the custom property updates in DevTools but nothing moves.
 *
 * The expected registrations mirror packages/tailwindcss/src/utilities.ts
 * (translateProperties, scaleProperties, transformProperties, touchProperties,
 * snapProperties, borderSpacingProperties, filterProperties,
 * backdropFilterProperties, cssContainProperties,
 * fontVariantNumericProperties, and the --tw-duration/--tw-ease/--tw-leading/
 * --tw-tracking singles).
 */
class PropertyRegistrationTest extends TestCase
{
    private const TRANSLATE_GROUP = ['--tw-translate-x', '--tw-translate-y', '--tw-translate-z'];

    private const SCALE_GROUP = ['--tw-scale-x', '--tw-scale-y', '--tw-scale-z'];

    private const TRANSFORM_GROUP = ['--tw-rotate-x', '--tw-rotate-y', '--tw-rotate-z', '--tw-skew-x', '--tw-skew-y'];

    private const TOUCH_GROUP = ['--tw-pan-x', '--tw-pan-y', '--tw-pinch-zoom'];

    private const CONTAIN_GROUP = ['--tw-contain-size', '--tw-contain-layout', '--tw-contain-paint', '--tw-contain-style'];

    private const BORDER_SPACING_GROUP = ['--tw-border-spacing-x', '--tw-border-spacing-y'];

    private const FONT_VARIANT_NUMERIC_GROUP = ['--tw-ordinal', '--tw-slashed-zero', '--tw-numeric-figure', '--tw-numeric-spacing', '--tw-numeric-fraction'];

    private const FILTER_GROUP = [
        '--tw-blur', '--tw-brightness', '--tw-contrast', '--tw-grayscale',
        '--tw-hue-rotate', '--tw-invert', '--tw-opacity', '--tw-saturate',
        '--tw-sepia', '--tw-drop-shadow', '--tw-drop-shadow-color',
        '--tw-drop-shadow-alpha', '--tw-drop-shadow-size',
    ];

    private const BACKDROP_FILTER_GROUP = [
        '--tw-backdrop-blur', '--tw-backdrop-brightness', '--tw-backdrop-contrast',
        '--tw-backdrop-grayscale', '--tw-backdrop-hue-rotate', '--tw-backdrop-invert',
        '--tw-backdrop-opacity', '--tw-backdrop-saturate', '--tw-backdrop-sepia',
    ];

    /**
     * Compile the given classes and return the emitted @property blocks as a
     * map of property name => block body.
     *
     * @return array<string, string>
     */
    private static function propertyBlocks(string $classes): array
    {
        $css = Tailwind::generate([
            'content' => '<div class="' . htmlspecialchars($classes) . '"></div>',
            'css' => '@import "tailwindcss/utilities.css";',
        ]);

        preg_match_all('/@property\s+(--[\w-]+)\s*\{([^}]*)\}/', $css, $matches, PREG_SET_ORDER);

        $blocks = [];
        foreach ($matches as $match) {
            $blocks[$match[1]] = trim($match[2]);
        }

        return $blocks;
    }

    /**
     * @return array<string, array{string, array<string>}>
     */
    public static function registeredGroupProvider(): array
    {
        return [
            // translate group (initial 0)
            'translate-4' => ['translate-4', self::TRANSLATE_GROUP],
            'translate-x-7' => ['translate-x-7', self::TRANSLATE_GROUP],
            '-translate-x-4' => ['-translate-x-4', self::TRANSLATE_GROUP],
            'translate-y-full' => ['translate-y-full', self::TRANSLATE_GROUP],
            'translate-full' => ['translate-full', self::TRANSLATE_GROUP],
            'translate-z-2' => ['translate-z-2', self::TRANSLATE_GROUP],
            'translate-3d' => ['translate-3d', self::TRANSLATE_GROUP],

            // scale group (initial 1)
            'scale-105' => ['scale-105', self::SCALE_GROUP],
            '-scale-75' => ['-scale-75', self::SCALE_GROUP],
            'scale-x-50' => ['scale-x-50', self::SCALE_GROUP],
            'scale-z-150' => ['scale-z-150', self::SCALE_GROUP],
            'scale-3d' => ['scale-3d', self::SCALE_GROUP],

            // transform group (no initial values)
            'rotate-x-45' => ['rotate-x-45', self::TRANSFORM_GROUP],
            'rotate-y-6' => ['rotate-y-6', self::TRANSFORM_GROUP],
            'rotate-z-90' => ['rotate-z-90', self::TRANSFORM_GROUP],
            'skew-2' => ['skew-2', self::TRANSFORM_GROUP],
            'skew-x-3' => ['skew-x-3', self::TRANSFORM_GROUP],
            'skew-y-6' => ['skew-y-6', self::TRANSFORM_GROUP],
            'transform' => ['transform', self::TRANSFORM_GROUP],
            'transform-[scale(2)]' => ['transform-[scale(2)]', self::TRANSFORM_GROUP],

            // filter group fires for every filter utility, not just drop-shadow
            'filter' => ['filter', self::FILTER_GROUP],
            'blur-sm' => ['blur-sm', self::FILTER_GROUP],
            'blur-none' => ['blur-none', self::FILTER_GROUP],
            'brightness-50' => ['brightness-50', self::FILTER_GROUP],
            'contrast-125' => ['contrast-125', self::FILTER_GROUP],
            'grayscale' => ['grayscale', self::FILTER_GROUP],
            'hue-rotate-90' => ['hue-rotate-90', self::FILTER_GROUP],
            'invert' => ['invert', self::FILTER_GROUP],
            'saturate-150' => ['saturate-150', self::FILTER_GROUP],
            'sepia' => ['sepia', self::FILTER_GROUP],
            'drop-shadow-md' => ['drop-shadow-md', self::FILTER_GROUP],

            // backdrop-filter group
            'backdrop-filter' => ['backdrop-filter', self::BACKDROP_FILTER_GROUP],
            'backdrop-blur-sm' => ['backdrop-blur-sm', self::BACKDROP_FILTER_GROUP],
            'backdrop-brightness-50' => ['backdrop-brightness-50', self::BACKDROP_FILTER_GROUP],
            'backdrop-grayscale' => ['backdrop-grayscale', self::BACKDROP_FILTER_GROUP],
            'backdrop-opacity-50' => ['backdrop-opacity-50', self::BACKDROP_FILTER_GROUP],

            // transition singles
            'duration-300' => ['duration-300', ['--tw-duration']],
            'duration-initial' => ['duration-initial', ['--tw-duration']],
            'ease-in' => ['ease-in', ['--tw-ease']],
            'ease-linear' => ['ease-linear', ['--tw-ease']],
            'ease-initial' => ['ease-initial', ['--tw-ease']],

            // typography singles
            'leading-tight' => ['leading-tight', ['--tw-leading']],
            'leading-6' => ['leading-6', ['--tw-leading']],
            'leading-none' => ['leading-none', ['--tw-leading']],
            'tracking-wide' => ['tracking-wide', ['--tw-tracking']],
            'tracking-[0.25em]' => ['tracking-[0.25em]', ['--tw-tracking']],

            // font-variant-numeric group
            'ordinal' => ['ordinal', self::FONT_VARIANT_NUMERIC_GROUP],
            'slashed-zero' => ['slashed-zero', self::FONT_VARIANT_NUMERIC_GROUP],
            'lining-nums' => ['lining-nums', self::FONT_VARIANT_NUMERIC_GROUP],
            'oldstyle-nums' => ['oldstyle-nums', self::FONT_VARIANT_NUMERIC_GROUP],
            'proportional-nums' => ['proportional-nums', self::FONT_VARIANT_NUMERIC_GROUP],
            'tabular-nums' => ['tabular-nums', self::FONT_VARIANT_NUMERIC_GROUP],
            'diagonal-fractions' => ['diagonal-fractions', self::FONT_VARIANT_NUMERIC_GROUP],
            'stacked-fractions' => ['stacked-fractions', self::FONT_VARIANT_NUMERIC_GROUP],

            // contain group
            'contain-size' => ['contain-size', self::CONTAIN_GROUP],
            'contain-inline-size' => ['contain-inline-size', self::CONTAIN_GROUP],
            'contain-layout' => ['contain-layout', self::CONTAIN_GROUP],
            'contain-paint' => ['contain-paint', self::CONTAIN_GROUP],
            'contain-style' => ['contain-style', self::CONTAIN_GROUP],

            // touch-action group
            'touch-pan-x' => ['touch-pan-x', self::TOUCH_GROUP],
            'touch-pan-left' => ['touch-pan-left', self::TOUCH_GROUP],
            'touch-pan-y' => ['touch-pan-y', self::TOUCH_GROUP],
            'touch-pan-down' => ['touch-pan-down', self::TOUCH_GROUP],
            'touch-pinch-zoom' => ['touch-pinch-zoom', self::TOUCH_GROUP],

            // scroll-snap strictness
            'snap-x' => ['snap-x', ['--tw-scroll-snap-strictness']],
            'snap-y' => ['snap-y', ['--tw-scroll-snap-strictness']],
            'snap-both' => ['snap-both', ['--tw-scroll-snap-strictness']],
            'snap-mandatory' => ['snap-mandatory', ['--tw-scroll-snap-strictness']],
            'snap-proximity' => ['snap-proximity', ['--tw-scroll-snap-strictness']],

            // border-spacing group
            'border-spacing-2' => ['border-spacing-2', self::BORDER_SPACING_GROUP],
            'border-spacing-x-2' => ['border-spacing-x-2', self::BORDER_SPACING_GROUP],
            'border-spacing-y-2' => ['border-spacing-y-2', self::BORDER_SPACING_GROUP],
        ];
    }

    /**
     * Every utility that composes from a --tw-* group registers the complete
     * group with @property.
     *
     * @param array<string> $expectedProperties
     */
    #[DataProvider('registeredGroupProvider')]
    public function test_utility_registers_its_variable_group(string $class, array $expectedProperties): void
    {
        $blocks = self::propertyBlocks($class);

        foreach ($expectedProperties as $property) {
            $this->assertArrayHasKey($property, $blocks, sprintf(
                "'%s' must register %s with @property (registered: %s)",
                $class,
                $property,
                implode(', ', array_keys($blocks)) ?: 'none',
            ));
        }

        $this->assertCount(count($expectedProperties), $blocks, sprintf(
            "'%s' must register exactly its own group (registered: %s)",
            $class,
            implode(', ', array_keys($blocks)),
        ));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function unregisteredUtilityProvider(): array
    {
        $classes = [
            'translate-none',
            'scale-none',
            'scale-[2]',
            'rotate-45',
            'rotate-none',
            'transform-cpu',
            'transform-gpu',
            'transform-none',
            'filter-none',
            'filter-[blur(2px)]',
            'backdrop-filter-none',
            'backdrop-filter-[blur(2px)]',
            'normal-nums',
            'contain-none',
            'contain-content',
            'contain-strict',
            'touch-auto',
            'touch-none',
            'snap-none',
            'snap-start',
            'snap-align-none',
            'delay-300',
        ];

        $cases = [];
        foreach ($classes as $class) {
            $cases[$class] = [$class];
        }

        return $cases;
    }

    /**
     * Utilities that set the CSS property directly (or reset it) must not
     * register anything, matching the reference implementation.
     */
    #[DataProvider('unregisteredUtilityProvider')]
    public function test_utility_registers_nothing(string $class): void
    {
        $blocks = self::propertyBlocks($class);

        $this->assertSame([], $blocks, sprintf(
            "'%s' must not emit @property registrations (registered: %s)",
            $class,
            implode(', ', array_keys($blocks)),
        ));
    }

    /**
     * The registration details must match the reference: syntax, inherits,
     * and the group's initial value.
     */
    public function test_registration_details_match_reference(): void
    {
        $translate = self::propertyBlocks('translate-x-7');
        $this->assertStringContainsString('syntax: "*"', $translate['--tw-translate-x']);
        $this->assertStringContainsString('inherits: false', $translate['--tw-translate-x']);
        $this->assertStringContainsString('initial-value: 0', $translate['--tw-translate-x']);
        $this->assertStringContainsString('initial-value: 0', $translate['--tw-translate-y']);
        $this->assertStringContainsString('initial-value: 0', $translate['--tw-translate-z']);

        $scale = self::propertyBlocks('scale-x-50');
        $this->assertStringContainsString('initial-value: 1', $scale['--tw-scale-x']);
        $this->assertStringContainsString('initial-value: 1', $scale['--tw-scale-y']);
        $this->assertStringContainsString('initial-value: 1', $scale['--tw-scale-z']);

        // The transform group registers without an initial value.
        $rotate = self::propertyBlocks('rotate-x-45');
        $this->assertStringNotContainsString('initial-value', $rotate['--tw-rotate-x']);
        $this->assertStringContainsString('syntax: "*"', $rotate['--tw-rotate-x']);

        $snap = self::propertyBlocks('snap-x');
        $this->assertStringContainsString('initial-value: proximity', $snap['--tw-scroll-snap-strictness']);

        $borderSpacing = self::propertyBlocks('border-spacing-x-2');
        $this->assertStringContainsString('syntax: "<length>"', $borderSpacing['--tw-border-spacing-x']);
        $this->assertStringContainsString('initial-value: 0', $borderSpacing['--tw-border-spacing-x']);

        $filter = self::propertyBlocks('blur-sm');
        $this->assertStringContainsString('syntax: "<percentage>"', $filter['--tw-drop-shadow-alpha']);
        $this->assertStringContainsString('initial-value: 100%', $filter['--tw-drop-shadow-alpha']);
    }

    /**
     * The @layer properties fallback (for browsers without @property support)
     * must carry the same initial values.
     */
    public function test_layer_properties_fallback_carries_initial_values(): void
    {
        $css = Tailwind::generate([
            'content' => '<div class="translate-x-7"></div>',
            'css' => '@import "tailwindcss/utilities.css";',
        ]);

        $this->assertStringContainsString('@layer properties', $css);
        $this->assertMatchesRegularExpression('/--tw-translate-y:\s*0/', $css);
        $this->assertMatchesRegularExpression('/--tw-translate-z:\s*0/', $css);
    }

    /**
     * The real-world symptom from issue #7: a theme toggle switching between
     * translate-x-* states. Every state must resolve to a valid `translate`
     * because --tw-translate-y is registered with initial-value 0.
     */
    public function test_translate_toggle_states_compose_validly(): void
    {
        $css = Tailwind::generate([
            'content' => '<div class="translate-x-0 translate-x-7 translate-x-14"></div>',
            'css' => '@import "tailwindcss/utilities.css";',
        ]);

        $this->assertStringContainsString('.translate-x-0', $css);
        $this->assertStringContainsString('.translate-x-7', $css);
        $this->assertStringContainsString('.translate-x-14', $css);
        $this->assertStringContainsString('@property --tw-translate-y', $css);
    }

    /**
     * normal-nums matches the reference exactly: only the resetting
     * font-variant-numeric declaration, no --tw-* writes.
     */
    public function test_normal_nums_only_resets_font_variant_numeric(): void
    {
        $css = Tailwind::generate([
            'content' => '<div class="normal-nums"></div>',
            'css' => '@import "tailwindcss/utilities.css";',
            'minify' => true,
        ]);

        $this->assertStringContainsString('.normal-nums{font-variant-numeric:normal}', $css);
        $this->assertStringNotContainsString('--tw-ordinal', $css);
    }
}
