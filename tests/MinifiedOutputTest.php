<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use TailwindPHP\LightningCss\LightningCss;
use TailwindPHP\Tailwind;
use TailwindPHP\tw;

class MinifiedOutputTest extends TestCase
{
    private function generateMinified(array $classes): string
    {
        return tw::generate([
            'content' => '<div class="' . implode(' ', $classes) . '"></div>',
            'css' => '@import "tailwindcss/utilities";',
            'minify' => true,
        ]);
    }

    public function test_generate_keeps_zero_units_in_a_var_fallback_inside_calc(): void
    {
        $css = $this->generateMinified(['max-h-[calc(100vh-10rem-var(--offset,0px))]']);

        $this->assertStringContainsString('max-height:calc(100vh - 10rem - var(--offset, 0px))', $css);
    }

    public function test_generate_keeps_zero_units_in_var_fallbacks_and_max(): void
    {
        $css = $this->generateMinified(['top-[var(--x,0px)]', 'pb-[max(0px,1rem)]']);

        $this->assertStringContainsString('top:var(--x, 0px)', $css);
        $this->assertStringContainsString('padding-bottom:max(0px, 1rem)', $css);
    }

    public function test_generate_keeps_zero_units_in_custom_properties(): void
    {
        $css = $this->generateMinified(['[--gap:0px]']);

        $this->assertStringContainsString('{--gap:0px}', $css);
    }

    public function test_generate_keeps_zero_units_in_strings_and_urls(): void
    {
        $css = $this->generateMinified(["content-['0px']", "bg-[url('/img/0px.png')]", 'bg-[url(/img/a0px.png)]']);

        $this->assertStringContainsString('--tw-content:"0px"', $css);
        $this->assertStringContainsString("background-image:url('/img/0px.png')", $css);
        $this->assertStringContainsString('background-image:url("/img/a0px.png")', $css);
    }

    public function test_generate_still_strips_zero_units_from_plain_values(): void
    {
        $css = $this->generateMinified(['top-[0px]', 'bg-[#ffffff]']);

        $this->assertStringContainsString('.top-\[0px\]{top:0}', $css);
        $this->assertStringContainsString('.bg-\[\#ffffff\]{background-color:#fff}', $css);
    }

    public function test_css_exact_minified_keeps_zero_units_in_math_functions(): void
    {
        $compiler = Tailwind::compile('@import "tailwindcss/utilities";');
        $css = $compiler->cssExact(['max-h-[calc(100vh-10rem-var(--offset,0px))]', 'rotate-[atan2(0px,1px)]'], true);

        $this->assertStringContainsString('var(--offset, 0px)', $css);
        $this->assertStringContainsString('atan2(0px, 1px)', $css);
    }

    public function test_minify_value_respects_context(): void
    {
        $this->assertSame('calc(100% - 0px)', LightningCss::minifyValue('calc(100% - 0px)', 'width'));
        $this->assertSame('0 var(--x, 0px)', LightningCss::minifyValue('0px var(--x, 0px)', 'margin'));
        $this->assertSame('0px', LightningCss::minifyValue('0px', '--gap'));
        $this->assertSame('0px', LightningCss::minifyValue('0px', 'initial-value'));
        $this->assertSame('url(/a/0px.png) 0', LightningCss::minifyValue('url(/a/0px.png) 0px', 'background'));
        $this->assertSame('"0px #ffffff" #fff', LightningCss::minifyValue('"0px #ffffff" #ffffff', 'content'));
        $this->assertSame('calc-size(auto, size + 0px)', LightningCss::minifyValue('calc-size(auto, size + 0px)', 'height'));
        $this->assertSame('translate(0, 10px)', LightningCss::minifyValue('translate(0px, 10px)', 'transform'));
        $this->assertSame('400', LightningCss::minifyValue('normal', 'font-weight'));
    }

    public function test_minify_value_runs_in_linear_time(): void
    {
        $value = str_repeat('0px calc(0px + 1rem) url(/0px.png) "0px" #ffffff ', 40_000);

        $start = microtime(true);
        $result = LightningCss::minifyValue($value, 'margin');
        $elapsed = microtime(true) - $start;

        $this->assertLessThan(extension_loaded('xdebug') ? 4.0 : 1.0, $elapsed);
        $this->assertStringStartsWith('0 calc(0px + 1rem) url(/0px.png) "0px" #fff 0 ', $result);
    }
}
