<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TailwindPHP\Minifier\CssMinifier;

class CssMinifierTest extends TestCase
{
    public function test_preserves_spaces_around_plus_in_calc(): void
    {
        $css = ':root { --px: calc(1rem + 0.5vw); }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('1rem + 0.5vw', $result);
    }

    public function test_preserves_spaces_in_nested_clamp_calc(): void
    {
        $css = ':root { --size: clamp(1.25rem, calc(1.106rem + 0.537vw), 1.75rem); }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('1.106rem + 0.537vw', $result);
    }

    public function test_preserves_spaces_around_minus_in_calc(): void
    {
        $css = '.foo { width: calc(100% - 2rem); }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('100% - 2rem', $result);
    }

    public function test_strips_whitespace_around_braces(): void
    {
        $css = '.foo { color: red; }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('.foo{color:red}', $result);
    }

    public function test_strips_whitespace_around_colons(): void
    {
        $css = '.foo { color : red ; }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('color:red', $result);
    }

    public function test_strips_whitespace_around_adjacent_sibling_combinator(): void
    {
        $css = '.a + .b { color: red; }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('.a+.b', $result);
    }

    public function test_strips_whitespace_around_child_combinator(): void
    {
        $css = '.a > .b { color: red; }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('.a>.b', $result);
    }

    public function test_strips_whitespace_around_general_sibling_combinator(): void
    {
        $css = '.a ~ .b { color: red; }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('.a~.b', $result);
    }

    public function test_handles_multiple_calc_expressions(): void
    {
        $css = '.foo { margin: calc(1rem + 2px) calc(100% - 50px); }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('1rem + 2px', $result);
        $this->assertStringContainsString('100% - 50px', $result);
    }

    public function test_handles_deeply_nested_functions(): void
    {
        $css = ':root { --x: max(1rem, min(2rem + 1vw, 3rem)); }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('2rem + 1vw', $result);
    }

    public function test_keeps_zero_length_units_in_a_var_fallback_inside_calc(): void
    {
        $css = '.nav { max-height: calc(100vh - 13.5rem - var(--topbar-h, 0px)); }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('var(--topbar-h, 0px)', $result);
        $this->assertStringNotContainsString('var(--topbar-h, 0)', $result);
    }

    public function test_keeps_zero_length_units_in_math_functions(): void
    {
        $css = '.a { width: calc(100% - 0px); height: min(0rem, 10vh); top: max(0px, 1rem); left: clamp(0px, 2vw, 1rem); }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('calc(100% - 0px)', $result);
        $this->assertStringContainsString('min(0rem,', $result);
        $this->assertStringContainsString('max(0px,', $result);
        $this->assertStringContainsString('clamp(0px,', $result);
    }

    public function test_keeps_zero_length_units_in_custom_properties(): void
    {
        $css = ':root { --gap: 0px; --inset: 0rem 0px; } .a { padding: calc(var(--gap) + 1rem); }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('--gap:0px', $result);
        $this->assertStringContainsString('--inset:0rem 0px', $result);
    }

    public function test_still_removes_zero_units_from_plain_values(): void
    {
        $css = '.a { margin: 0px; padding: 0rem 1rem 0em; transform: translate(0px, 10px); width: 10px; height: 1.0px; }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('margin:0}', str_replace(';', '}', $result));
        $this->assertStringContainsString('padding:0 1rem 0', $result);
        $this->assertStringContainsString('translate(0,10px)', str_replace(', ', ',', $result));
        $this->assertStringContainsString('width:10px', $result);
        $this->assertStringContainsString('height:1.0px', $result);
    }

    public function test_leaves_zero_units_in_strings_untouched(): void
    {
        $css = '.a::before { content: "0px"; margin: 0px; }';
        $result = CssMinifier::minify($css);

        $this->assertStringContainsString('content:"0px"', $result);
        $this->assertStringContainsString('margin:0', $result);
    }
}
