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

    public function test_leaves_zero_units_in_selectors_untouched(): void
    {
        $this->assertSame('.top-\[0px\]{top:0}', CssMinifier::minify('.top-\[0px\] { top: 0px; }'));
        $this->assertSame('[data-w=0px]{margin:0}', CssMinifier::minify('[data-w=0px] { margin: 0px; }'));
        $this->assertSame('.\31 0px{margin:0}', CssMinifier::minify('.\31 0px { margin: 0px; }'));
        $this->assertSame(
            '.pb-\[max\(0px\,env\(safe-area-inset-bottom\)\)\]{padding-bottom:max(0px,env(safe-area-inset-bottom))}',
            CssMinifier::minify('.pb-\[max\(0px\,env\(safe-area-inset-bottom\)\)\] { padding-bottom: max(0px,env(safe-area-inset-bottom)); }'),
        );
    }

    public function test_leaves_hex_colors_in_selectors_untouched(): void
    {
        $this->assertSame('.bg-\[\#ffffff\]{background-color:#fff}', CssMinifier::minify('.bg-\[\#ffffff\] { background-color: #ffffff; }'));
    }

    public function test_leaves_url_arguments_untouched(): void
    {
        $this->assertSame('.a{background:url(/img/0px.png) 0 0}', CssMinifier::minify('.a { background: url(/img/0px.png) 0px 0px; }'));
        $this->assertSame('.a{background:url("/img/0px.png")}', CssMinifier::minify('.a { background: url("/img/0px.png"); }'));
        $this->assertSame('.a{filter:url(#ffffff);color:#abc}', CssMinifier::minify('.a { filter: url(#ffffff); color: #AABBCC; }'));
        $this->assertSame(
            '.a{background:url(data:image/svg+xml;base64,AAA0px);margin:0}',
            CssMinifier::minify('.a { background: url(data:image/svg+xml;base64,AAA0px); margin: 0px; }'),
        );
    }

    public function test_leaves_hex_colors_in_strings_untouched(): void
    {
        $this->assertSame('.a::before{content:"0px #ffffff";color:#fff}', CssMinifier::minify('.a::before { content: "0px #ffffff"; color: #ffffff; }'));
    }

    public function test_keeps_zero_length_units_in_atan2_and_calc_size(): void
    {
        $this->assertSame('.a{rotate:atan2(0px,1px)}', CssMinifier::minify('.a { rotate: atan2(0px,1px); }'));
        $this->assertSame('.a{height:calc-size(auto,size + 0px)}', CssMinifier::minify('.a { height: calc-size(auto,size + 0px); }'));
        $this->assertSame('.a{width:-moz-calc(100% - 0px)}', CssMinifier::minify('.a { width: -moz-calc(100% - 0px); }'));
        $this->assertSame('.a{opacity:progress(0px,0px,10px)}', CssMinifier::minify('.a { opacity: progress(0px,0px,10px); }'));
    }

    public function test_keeps_zero_length_units_in_registered_initial_values(): void
    {
        $css = '@property --x { syntax: "*"; inherits: false; initial-value: 0px; }';

        $this->assertSame('@property --x{syntax:"*";inherits:false;initial-value:0px}', CssMinifier::minify($css));
    }

    public function test_minifies_declarations_in_nested_rules_and_keyframes(): void
    {
        $this->assertSame('.a{margin:0;&:hover{padding:0}}', CssMinifier::minify('.a { margin: 0px; &:hover { padding: 0rem; } }'));
        $this->assertSame('@keyframes k{0%{top:0}to{top:10px}}', CssMinifier::minify('@keyframes k { 0% { top: 0px; } to { top: 10px; } }'));
        $this->assertSame('@media (min-width:0px){.a{margin:0}}', CssMinifier::minify('@media (min-width: 0px) { .a { margin: 0px; } }'));
    }

    public function test_minifies_important_declarations(): void
    {
        $this->assertSame(
            '.a{font-weight:400 !important;margin:0!important}',
            CssMinifier::minify('.a { font-weight: normal !important; margin: 0px!important; }'),
        );
    }

    public function test_leaves_number_continuations_untouched(): void
    {
        $this->assertSame(
            '.a{width:10px;height:1.0px;top:-0px;left:0;x:0%;y:0s}',
            CssMinifier::minify('.a { width: 10px; height: 1.0px; top: -0px; left: 0vmin; x: 0%; y: 0s; }'),
        );
    }

    public function test_minifies_large_stylesheets_in_linear_time(): void
    {
        $unit = ".p-\[0px\] { margin: 0px; width: calc(100% - 0px); padding: 0 1rem; color: #ffffff; }\n"
            . ".b:hover { top: max(0px, 1rem); background: url(/img/0px.png) 0px 0px; content: \"0px\"; }\n";
        $css = str_repeat($unit, intdiv(2_000_000, strlen($unit)));

        $start = microtime(true);
        $result = CssMinifier::minify($css);
        $elapsed = microtime(true) - $start;

        $this->assertLessThan(extension_loaded('xdebug') ? 4.0 : 1.0, $elapsed);
        $this->assertStringStartsWith('.p-\[0px\]{margin:0;width:calc(100% - 0px);padding:0 1rem;color:#fff}', $result);
    }
}
