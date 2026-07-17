<?php

declare(strict_types=1);

require __DIR__.'/../autoload.php';

use TailwindPHP\Minifier\CssMinifier;
use TailwindPHP\Tailwind;

$inputs = [
    'minimal' => (string) file_get_contents(__DIR__.'/fixtures/css-minimal.css'),
    'theme' => '@import "tailwindcss";'."\n".file_get_contents(__DIR__.'/fixtures/theme-style.css'),
];

$pages = [];
foreach (glob(__DIR__.'/fixtures/pages/*.json') as $pageFile) {
    $page = json_decode((string) file_get_contents($pageFile), true);
    $pages[basename($pageFile, '.json')] = '<div class="'.implode(' ', $page['candidates']).'"></div>';
}

$failures = 0;
$checked = 0;

$check = function (string $key, string $expected, string $actual) use (&$failures, &$checked) {
    $checked++;
    if ($expected !== $actual) {
        $failures++;
        echo "DIFF $key: expected ".strlen($expected).' bytes ('.substr(hash('sha256', $expected), 0, 12).') got '.strlen($actual).' bytes ('.substr(hash('sha256', $actual), 0, 12).")\n";
    }
};

foreach ($inputs as $inputName => $css) {
    $cold = [];
    foreach ($pages as $pageName => $content) {
        $cold[$pageName] = [
            'pretty' => Tailwind::generate(['content' => $content, 'css' => $css, 'minify' => false]),
            'min' => Tailwind::generate(['content' => $content, 'css' => $css, 'minify' => true]),
        ];
    }

    $compiler = Tailwind::compile($css);

    foreach ($pages as $pageName => $content) {
        $exact = $compiler->generateExact($content);
        $check("$pageName|$inputName|pass1|pretty", $cold[$pageName]['pretty'], $exact);
        $check("$pageName|$inputName|pass1|min", $cold[$pageName]['min'], CssMinifier::minify($exact));
    }

    foreach ($pages as $pageName => $content) {
        $exact = $compiler->generateExact($content);
        $check("$pageName|$inputName|pass2|pretty", $cold[$pageName]['pretty'], $exact);
        $check("$pageName|$inputName|pass2|min", $cold[$pageName]['min'], CssMinifier::minify($exact));
    }

    foreach ($pages as $content) {
        $compiler->generate($content);
    }

    foreach ($pages as $pageName => $content) {
        $exact = $compiler->generateExact($content);
        $check("$pageName|$inputName|pass3-after-cumulative|pretty", $cold[$pageName]['pretty'], $exact);
        $check("$pageName|$inputName|pass3-after-cumulative|min", $cold[$pageName]['min'], CssMinifier::minify($exact));
    }
}

echo $failures === 0 ? "EXACT-MODE PARITY: $checked combinations byte-identical to cold generate()\n" : "FAILURES: $failures of $checked\n";
exit($failures === 0 ? 0 : 1);
