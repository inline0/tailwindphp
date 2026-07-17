<?php

declare(strict_types=1);

$rootDir = dirname(__DIR__);
require_once $rootDir . '/vendor/autoload.php';

use function TailwindPHP\CssParser\parse;
use function TailwindPHP\DesignSystem\buildDesignSystem;
use function TailwindPHP\loadDefaultTheme;

$themeCss = file_get_contents($rootDir . '/resources/theme.css');
$preflightCss = file_get_contents($rootDir . '/resources/preflight.css');

function bench(string $label, callable $fn, int $iterations = 60): void
{
    for ($i = 0; $i < 5; $i++) {
        $fn();
    }
    $total = 0;
    for ($i = 0; $i < $iterations; $i++) {
        $s = hrtime(true);
        $fn();
        $total += hrtime(true) - $s;
    }
    printf("  %-46s %8.2f ms\n", $label, $total / $iterations / 1e6);
}

echo "Stage 3 internals (per generate() call cost):\n";

loadDefaultTheme();

bench('parse(theme.css) [every call]', fn () => parse($themeCss));
bench('parse(preflight.css) [every call]', fn () => parse($preflightCss));
bench('loadDefaultTheme (cached, clone)', fn () => loadDefaultTheme());

$theme = loadDefaultTheme();
bench('buildDesignSystem: createUtilities+Variants', function () use ($theme) {
    buildDesignSystem(clone $theme);
});

$themeAst = parse($themeCss);
bench('walk theme AST -> theme->add (approx)', function () use ($themeCss) {
    $ast = parse($themeCss);
}, 30);
