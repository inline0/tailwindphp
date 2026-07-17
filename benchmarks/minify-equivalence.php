<?php

declare(strict_types=1);

require __DIR__.'/../autoload.php';

use function TailwindPHP\CssParser\parse;

use TailwindPHP\Minifier\CssMinifier;
use TailwindPHP\Tailwind;

/**
 * Structural equivalence gate for minified serialization.
 *
 * For every fixture combination, the legacy string-minifier output (CssMinifier
 * over the pretty serialization) and the new minified serializer output are
 * parsed with the repo css-parser and compared structurally: same node kinds,
 * same order (declaration order included), same selectors/params/properties/
 * values modulo whitespace. Also asserts the new output is at most 1% larger
 * than the legacy output per fixture.
 */
function normalizeText(string $s): string
{
    $out = '';
    $len = strlen($s);
    $quote = null;

    for ($i = 0; $i < $len; $i++) {
        $ch = $s[$i];

        if ($quote !== null) {
            $out .= $ch;
            if ($ch === '\\' && $i + 1 < $len) {
                $out .= $s[++$i];
            } elseif ($ch === $quote) {
                $quote = null;
            }

            continue;
        }

        if ($ch === '"' || $ch === "'") {
            $quote = $ch;
            $out .= $ch;

            continue;
        }

        if ($ch === ' ' || $ch === "\t" || $ch === "\n" || $ch === "\r") {
            while ($i + 1 < $len && ($s[$i + 1] === ' ' || $s[$i + 1] === "\t" || $s[$i + 1] === "\n" || $s[$i + 1] === "\r")) {
                $i++;
            }
            $prev = $out !== '' ? $out[strlen($out) - 1] : '';
            $next = $i + 1 < $len ? $s[$i + 1] : '';
            if ($prev === '' || $next === '') {
                continue;
            }
            if (str_contains(',:>~+()', $prev) || str_contains(',:>~+()', $next)) {
                continue;
            }
            $out .= ' ';

            continue;
        }

        $out .= $ch;
    }

    return $out;
}

function normalizeAst(array $nodes): array
{
    $out = [];
    foreach ($nodes as $node) {
        switch ($node['kind']) {
            case 'comment':
                break;
            case 'declaration':
                $out[] = [
                    'kind' => 'declaration',
                    'property' => $node['property'],
                    'value' => normalizeText($node['value'] ?? ''),
                    'important' => $node['important'],
                ];
                break;
            case 'rule':
                $children = normalizeAst($node['nodes']);
                if ($children === []) {
                    break;
                }
                $out[] = [
                    'kind' => 'rule',
                    'selector' => normalizeText($node['selector']),
                    'nodes' => $children,
                ];
                break;
            case 'at-rule':
                $out[] = [
                    'kind' => 'at-rule',
                    'name' => $node['name'],
                    'params' => normalizeText($node['params'] ?? ''),
                    'nodes' => normalizeAst($node['nodes'] ?? []),
                ];
                break;
            default:
                $out[] = $node;
        }
    }

    return $out;
}

function firstDifference(array $a, array $b, string $path = ''): ?string
{
    $n = max(count($a), count($b));
    for ($i = 0; $i < $n; $i++) {
        if (! isset($a[$i]) || ! isset($b[$i])) {
            return "$path/[$i]: old=".json_encode($a[$i] ?? null).' new='.json_encode($b[$i] ?? null);
        }
        $x = $a[$i];
        $y = $b[$i];
        foreach (['kind', 'selector', 'name', 'params', 'property', 'value', 'important'] as $key) {
            if (($x[$key] ?? null) !== ($y[$key] ?? null)) {
                return "$path/[$i].$key: old=".json_encode($x[$key] ?? null).' new='.json_encode($y[$key] ?? null);
            }
        }
        if (isset($x['nodes']) || isset($y['nodes'])) {
            $diff = firstDifference($x['nodes'] ?? [], $y['nodes'] ?? [], "$path/[$i]".($x['selector'] ?? $x['name'] ?? ''));
            if ($diff !== null) {
                return $diff;
            }
        }
    }

    return null;
}

$inputs = [
    'minimal' => (string) file_get_contents(__DIR__.'/fixtures/css-minimal.css'),
    'theme' => '@import "tailwindcss";'."\n".file_get_contents(__DIR__.'/fixtures/theme-style.css'),
];

$failures = 0;

foreach (glob(__DIR__.'/fixtures/pages/*.json') as $pageFile) {
    $page = json_decode((string) file_get_contents($pageFile), true);
    $content = '<div class="'.implode(' ', $page['candidates']).'"></div>';
    foreach ($inputs as $inputName => $css) {
        $key = basename($pageFile, '.json')."|$inputName";

        $pretty = Tailwind::generate(['content' => $content, 'css' => $css, 'minify' => false]);
        $old = CssMinifier::minify($pretty);
        $new = Tailwind::generate(['content' => $content, 'css' => $css, 'minify' => true]);

        $oldAst = normalizeAst(parse($old));
        $newAst = normalizeAst(parse($new));

        $diff = firstDifference($oldAst, $newAst);
        $oldBytes = strlen($old);
        $newBytes = strlen($new);
        $ratio = $oldBytes > 0 ? $newBytes / $oldBytes : 1.0;

        $structuralOk = $diff === null;
        $sizeOk = $newBytes <= (int) ceil($oldBytes * 1.01);

        printf(
            "%-28s old=%6d new=%6d (%+.2f%%) structural=%s size<=+1%%=%s\n",
            $key,
            $oldBytes,
            $newBytes,
            ($ratio - 1) * 100,
            $structuralOk ? 'EQUAL' : 'DIFF',
            $sizeOk ? 'ok' : 'FAIL',
        );

        if (! $structuralOk) {
            $failures++;
            echo "  first difference at $diff\n";
        }
        if (! $sizeOk) {
            $failures++;
        }
    }
}

echo $failures === 0 ? "EQUIVALENT: all fixtures\n" : "FAILURES: $failures\n";
exit($failures === 0 ? 0 : 1);
