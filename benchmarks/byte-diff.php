<?php

declare(strict_types=1);

require __DIR__.'/../autoload.php';

use TailwindPHP\Tailwind;

$record = in_array('--record', $argv, true);
$skipMinified = in_array('--skip-minified', $argv, true);
$expectedFile = __DIR__.'/fixtures/expected-hashes.json';
$expected = is_file($expectedFile) ? json_decode((string) file_get_contents($expectedFile), true) : [];
$actual = [];
$failures = 0;

$inputs = [
    'minimal' => (string) file_get_contents(__DIR__.'/fixtures/css-minimal.css'),
    'theme' => '@import "tailwindcss";'."\n".file_get_contents(__DIR__.'/fixtures/theme-style.css'),
];

foreach (glob(__DIR__.'/fixtures/pages/*.json') as $pageFile) {
    $page = json_decode((string) file_get_contents($pageFile), true);
    $content = '<div class="'.implode(' ', $page['candidates']).'"></div>';
    foreach ($inputs as $inputName => $css) {
        foreach ([true, false] as $minify) {
            if ($skipMinified && $minify) {
                continue;
            }
            $key = basename($pageFile, '.json')."|$inputName|".($minify ? 'min' : 'pretty');
            $out = Tailwind::generate(['content' => $content, 'css' => $css, 'minify' => $minify]);
            $actual[$key] = ['sha256' => hash('sha256', $out), 'bytes' => strlen($out)];
            if (! $record) {
                $want = $expected[$key]['sha256'] ?? null;
                if ($want !== $actual[$key]['sha256']) {
                    $failures++;
                    echo "DIFF $key: expected ".substr((string) $want, 0, 12).' got '.substr($actual[$key]['sha256'], 0, 12)."\n";
                }
            }
        }
    }
}

if ($record) {
    ksort($actual);
    file_put_contents($expectedFile, json_encode($actual, JSON_PRETTY_PRINT)."\n");
    echo 'Recorded '.count($actual)." expected hashes\n";
    exit(0);
}

echo $failures === 0 ? 'BYTE-IDENTICAL: '.count($actual)." combinations\n" : "FAILURES: $failures\n";
exit($failures === 0 ? 0 : 1);
