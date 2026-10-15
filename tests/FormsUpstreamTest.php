<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\TestCase;

use function TailwindPHP\compile;

final class FormsUpstreamTest extends TestCase
{
    public function testBaseSelectorsFollowForms0511Specificity(): void
    {
        $compiled = compile('@plugin "@tailwindcss/forms"; @import "tailwindcss/utilities.css";', ['loadDefaultTheme' => false]);
        $css = $compiled['build']([]);
        foreach (['text', 'email', 'url', 'password', 'number', 'date', 'datetime-local', 'month', 'search', 'tel', 'time', 'week', 'checkbox', 'radio', 'file'] as $type) {
            self::assertStringContainsString("input:where([type='{$type}'])", $css);
        }
        self::assertStringContainsString('select:where([multiple])', $css);
        self::assertStringContainsString('select:where([size]:not([size="1"]))', $css);
        self::assertStringContainsString("input:where([type='checkbox']):checked", $css);
        self::assertStringContainsString("input:where([type='file']):focus", $css);
    }

    public function testReferencePluginsRegisterClassesWithoutEmittingBaseStyles(): void
    {
        $compiled = compile('@media reference { @plugin "@tailwindcss/forms"; } @import "tailwindcss/utilities.css";', ['loadDefaultTheme' => false]);
        $css = $compiled['build'](['form-input']);
        self::assertStringContainsString('.form-input', $css);
        self::assertStringNotContainsString("input:where([type='text'])", $css);
        self::assertStringNotContainsString('@layer base', $css);
    }

    public function testClassOnlyStrategyDoesNotEmitBaseStyles(): void
    {
        $compiled = compile('@plugin "@tailwindcss/forms" { strategy: "class"; } @import "tailwindcss/utilities.css";', ['loadDefaultTheme' => false]);
        $css = $compiled['build'](['form-input']);
        self::assertStringContainsString('.form-input', $css);
        self::assertStringNotContainsString('@layer base', $css);
    }

}
