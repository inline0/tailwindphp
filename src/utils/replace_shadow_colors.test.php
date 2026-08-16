<?php

declare(strict_types=1);

namespace TailwindPHP;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

use function TailwindPHP\DesignSystem\replaceAlpha;
use function TailwindPHP\Utils\replaceShadowColors;

/**
 * Tests for replace-shadow-colors.php
 *
 * Port of: packages/tailwindcss/src/utils/replace-shadow-colors.test.ts
 */
class replace_shadow_colors extends TestCase
{
    /**
     * Helper replacer without alpha modification.
     */
    private function simpleReplacer(string $color): string
    {
        return "var(--tw-shadow-color, {$color})";
    }

    /**
     * Helper replacer with alpha modification (50%).
     */
    private function alphaReplacer(string $color): string
    {
        return 'var(--tw-shadow-color, ' . replaceAlpha($color, '50%') . ')';
    }

    // ==================================================
    // Without replacer (simple)
    // ==================================================

    #[Test]
    public function should_handle_var_shadow(): void
    {
        $parsed = replaceShadowColors('var(--my-shadow)', fn ($c) => $this->simpleReplacer($c));
        $this->assertEquals('var(--my-shadow)', $parsed);
    }

    #[Test]
    public function should_handle_var_shadow_with_offset(): void
    {
        $parsed = replaceShadowColors('1px var(--my-shadow)', fn ($c) => $this->simpleReplacer($c));
        $this->assertEquals('1px var(--my-shadow)', $parsed);
    }

    #[Test]
    public function should_handle_var_color_with_offsets(): void
    {
        $parsed = replaceShadowColors('1px 1px var(--my-color)', fn ($c) => $this->simpleReplacer($c));
        $this->assertEquals('1px 1px var(--tw-shadow-color, var(--my-color))', $parsed);
    }

    #[Test]
    public function should_handle_var_color_with_zero_offsets(): void
    {
        $parsed = replaceShadowColors('0 0 0 var(--my-color)', fn ($c) => $this->simpleReplacer($c));
        $this->assertEquals('0 0 0 var(--tw-shadow-color, var(--my-color))', $parsed);
    }

    #[Test]
    public function should_handle_two_values_with_currentcolor(): void
    {
        $parsed = replaceShadowColors('1px 2px', fn ($c) => $this->simpleReplacer($c));
        $this->assertEquals('1px 2px var(--tw-shadow-color, currentcolor)', $parsed);
    }

    #[Test]
    public function should_handle_three_values_with_currentcolor(): void
    {
        $parsed = replaceShadowColors('1px 2px 3px', fn ($c) => $this->simpleReplacer($c));
        $this->assertEquals('1px 2px 3px var(--tw-shadow-color, currentcolor)', $parsed);
    }

    #[Test]
    public function should_handle_four_values_with_currentcolor(): void
    {
        $parsed = replaceShadowColors('1px 2px 3px 4px', fn ($c) => $this->simpleReplacer($c));
        $this->assertEquals('1px 2px 3px 4px var(--tw-shadow-color, currentcolor)', $parsed);
    }

    #[Test]
    public function should_handle_multiple_shadows(): void
    {
        $input = implode(', ', ['var(--my-shadow)', '1px 1px var(--my-color)', '0 0 1px var(--my-color)']);
        $parsed = replaceShadowColors($input, fn ($c) => $this->simpleReplacer($c));
        $this->assertEquals(
            'var(--my-shadow), 1px 1px var(--tw-shadow-color, var(--my-color)), 0 0 1px var(--tw-shadow-color, var(--my-color))',
            $parsed,
        );
    }

    // ==================================================
    // With replacer (alpha modification)
    // ==================================================

    #[Test]
    public function should_handle_var_color_with_intensity(): void
    {
        $parsed = replaceShadowColors('1px 1px var(--my-color)', fn ($c) => $this->alphaReplacer($c));
        // PHP uses color-mix for better browser support
        $this->assertEquals(
            '1px 1px var(--tw-shadow-color, color-mix(in oklab, var(--my-color) 50%, transparent))',
            $parsed,
        );
    }

    #[Test]
    public function should_handle_box_shadow_with_intensity(): void
    {
        $parsed = replaceShadowColors('1px 1px var(--my-color)', fn ($c) => $this->alphaReplacer($c));
        // PHP uses color-mix for better browser support
        $this->assertEquals(
            '1px 1px var(--tw-shadow-color, color-mix(in oklab, var(--my-color) 50%, transparent))',
            $parsed,
        );
    }

    #[Test]
    public function should_handle_four_values_with_intensity_and_no_color_value(): void
    {
        $parsed = replaceShadowColors('1px 2px 3px 4px', fn ($c) => $this->alphaReplacer($c));
        // PHP uses color-mix for better browser support
        $this->assertEquals(
            '1px 2px 3px 4px var(--tw-shadow-color, color-mix(in oklab, currentcolor 50%, transparent))',
            $parsed,
        );
    }

    #[Test]
    public function should_handle_multiple_shadows_with_intensity(): void
    {
        $input = implode(', ', ['var(--my-shadow)', '1px 1px var(--my-color)', '0 0 1px var(--my-color)']);
        $parsed = replaceShadowColors($input, fn ($c) => $this->alphaReplacer($c));
        // PHP uses color-mix for better browser support
        $this->assertEquals(
            'var(--my-shadow), 1px 1px var(--tw-shadow-color, color-mix(in oklab, var(--my-color) 50%, transparent)), 0 0 1px var(--tw-shadow-color, color-mix(in oklab, var(--my-color) 50%, transparent))',
            $parsed,
        );
    }

    /**
     * Port of the v4.3.3 "should find the color regardless of its position"
     * cartesian test: known lengths (raw numbers, calc(…), --spacing(…)) never
     * count as colors, so the color is found in any of the shadow positions.
     */
    #[Test]
    public function should_find_the_color_regardless_of_its_position(): void
    {
        $xs = ['calc(var(--spacing) * 1)', '1', '--spacing(1)'];
        $ys = ['calc(var(--spacing) * 2)', '2', '--spacing(2)'];
        $blurs = ['calc(var(--spacing) * 3)', '3', '--spacing(3)'];
        $spreads = ['calc(var(--spacing) * 4)', '4', '--spacing(4)'];
        $colors = ['black', 'rgb(0, 0, 0)', '#000', '--alpha(var(--color) / 50%)', 'var(--uknown-color)'];

        foreach ($xs as $x) {
            foreach ($ys as $y) {
                foreach ($blurs as $blur) {
                    foreach ($spreads as $spread) {
                        foreach ($colors as $color) {
                            $expectedColor = "var(--tw-shadow-color, {$color})";

                            foreach ([
                                "{$x} {$color} {$y} {$blur} {$spread}",
                                "{$x} {$y} {$color} {$blur} {$spread}",
                                "{$x} {$y} {$blur} {$color} {$spread}",
                            ] as $input) {
                                $this->assertEquals(
                                    str_replace($color, $expectedColor, $input),
                                    replaceShadowColors($input, fn ($c) => $this->simpleReplacer($c)),
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Port of the v4.3.3 "should find the color (%s)" cases: when using
     * `var(…)` for the lengths we don't know their types, but a recognizable
     * color (named, hex, color function, --alpha) is still found.
     */
    #[Test]
    public function should_find_the_color_between_unknown_variables(): void
    {
        foreach (['black', '#000', 'rgb(0, 0, 0)', '--alpha(var(--color) / 50%)'] as $color) {
            $expectedColor = "var(--tw-shadow-color, {$color})";

            foreach ([
                "var(--x) var(--y) {$color}",
                "var(--x) var(--y) var(--blur) {$color}",
                "var(--x) var(--y) var(--blur) var(--spread) {$color}",
            ] as $input) {
                $this->assertEquals(
                    str_replace($color, $expectedColor, $input),
                    replaceShadowColors($input, fn ($c) => $this->simpleReplacer($c)),
                );
            }
        }
    }
}
