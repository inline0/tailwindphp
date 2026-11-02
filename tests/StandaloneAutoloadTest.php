<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class StandaloneAutoloadTest extends TestCase
{
    #[Test]
    public function itLoadsEveryComposerFileAutoload(): void
    {
        $root = dirname(__DIR__);
        $composer = json_decode(file_get_contents($root . '/composer.json'), true, flags: JSON_THROW_ON_ERROR);
        $expected = array_map(fn (string $file): string => substr($file, strlen('src/')), $composer['autoload']['files']);

        preg_match_all("/'([^']+\\.php)'/", file_get_contents($root . '/autoload.php'), $matches);

        self::assertSame($expected, $matches[1]);
    }

    #[Test]
    public function itCompilesThroughTheStandaloneAutoloaderAlone(): void
    {
        $root = dirname(__DIR__);
        $script = 'require ' . var_export($root . '/autoload.php', true) . ';'
            . 'echo \TailwindPHP\Tailwind::generate(\'<div class="flex-grow has-data-[slot=icon]:pl-2">\', \'@import "tailwindcss/utilities.css";\');';
        $output = [];
        $status = 0;
        exec(escapeshellarg(PHP_BINARY) . ' -r ' . escapeshellarg($script) . ' 2>&1', $output, $status);
        $css = implode("\n", $output);

        self::assertSame(0, $status, $css);
        self::assertStringContainsString('flex-grow: 1;', $css);
        self::assertStringContainsString(':has([data-slot="icon"])', $css);
    }
}
