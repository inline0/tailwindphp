<?php

declare(strict_types=1);

$rootDir = dirname(__DIR__);
require_once $rootDir . '/vendor/autoload.php';

use function TailwindPHP\Ast\toCss;
use function TailwindPHP\Compile\compileCandidates;
use function TailwindPHP\CssParser\parse;
use function TailwindPHP\extractCandidates;

use const TailwindPHP\FEATURE_NONE;

use TailwindPHP\Minifier\CssMinifier;

use function TailwindPHP\optimizeAst;
use function TailwindPHP\parseCss;

use const TailwindPHP\POLYFILL_ALL;

use function TailwindPHP\substituteAtApply;
use function TailwindPHP\substituteFunctions;

use TailwindPHP\Tailwind;

use function TailwindPHP\Walk\walk;

use TailwindPHP\Walk\WalkAction;

$corpusDir = $argv[1] ?? '/Users/dennis/Local Sites/fabrikat/app/public/wp-content/uploads/sites/334/divine/static-prerender';
$files = glob($corpusDir . '/*.html');
sort($files);

if (empty($files)) {
    fwrite(STDERR, "No corpus files in {$corpusDir}\n");
    exit(1);
}

$cssInput = '@import "tailwindcss";';

function ms(int $ns): float
{
    return $ns / 1e6;
}

function stagedGenerate(string $content, string $cssInput, array &$stageTotals): string
{
    $t = [];
    $mark = function (string $stage, int $start) use (&$t) {
        $t[$stage] = ($t[$stage] ?? 0) + (hrtime(true) - $start);
    };

    $s = hrtime(true);
    $candidates = extractCandidates($content);
    $mark('1 extractCandidates (candidate content)', $s);

    $s = hrtime(true);
    $ast = parse($cssInput);
    $mark('2 css-parser parse(css input)', $s);

    $s = hrtime(true);
    $result = parseCss($ast, []);
    $mark('3 parseCss / design system build', $s);

    $designSystem = $result['designSystem'];
    $features = $result['features'];

    $s = hrtime(true);
    $features |= substituteFunctions($ast, $designSystem);
    $mark('4 substituteFunctions (root ast)', $s);

    $s = hrtime(true);
    $features |= substituteAtApply($ast, $designSystem);
    walk($ast, function (&$node) {
        if ($node['kind'] !== 'at-rule') {
            return WalkAction::Continue;
        }
        if ($node['name'] === '@utility') {
            return WalkAction::Replace([]);
        }

        return WalkAction::Skip;
    });
    $mark('5 substituteAtApply + strip @utility', $s);

    if ($features === FEATURE_NONE) {
        return toCss($ast);
    }

    $valid = [];
    foreach ($candidates as $candidate) {
        if (!$designSystem->hasInvalidCandidate($candidate)) {
            if (str_starts_with($candidate, '--')) {
                $designSystem->getTheme()->markUsedVariable($candidate);
            } else {
                $valid[$candidate] = true;
            }
        }
    }

    $s = hrtime(true);
    $compileResult = compileCandidates(
        array_keys($valid),
        $designSystem,
        ['onInvalidCandidate' => function ($candidate) use ($designSystem) {
            $designSystem->addInvalidCandidate($candidate);
        }],
    );
    $newNodes = $compileResult['astNodes'];
    $mark('6 compileCandidates', $s);

    $s = hrtime(true);
    substituteFunctions($newNodes, $designSystem);
    $mark('7 substituteFunctions (utilities)', $s);

    $s = hrtime(true);
    walk($ast, function (&$node) use ($newNodes) {
        if ($node['kind'] === 'context' && isset($node['context']) && is_array($node['context'])) {
            $node['nodes'] = $newNodes;

            return WalkAction::Stop;
        }

        return WalkAction::Continue;
    });
    $mark('8 inject utilities node', $s);

    $s = hrtime(true);
    $compiled = optimizeAst($ast, $designSystem, POLYFILL_ALL);
    $mark('9 optimizeAst (incl LightningCss)', $s);

    $s = hrtime(true);
    $css = toCss($compiled);
    $mark('10 toCss', $s);

    $s = hrtime(true);
    $min = CssMinifier::minify($css);
    $mark('11 CssMinifier::minify', $s);

    foreach ($t as $stage => $ns) {
        $stageTotals[$stage] = ($stageTotals[$stage] ?? 0) + $ns;
    }

    return $min;
}

echo "Corpus: {$corpusDir}\n";
echo 'Pages:  ' . count($files) . "\n\n";

$pages = [];
foreach ($files as $file) {
    $html = file_get_contents($file);
    $s = hrtime(true);
    $candidates = Tailwind::extractCandidates($html);
    $extractNs = hrtime(true) - $s;
    $content = '<div class="' . implode(' ', $candidates) . '">';
    $pages[] = [
        'file' => basename($file),
        'bytes' => strlen($html),
        'candidates' => count($candidates),
        'extractFullHtmlNs' => $extractNs,
        'content' => $content,
        'html' => $html,
    ];
}

$sanity = $pages[0];
$expected = Tailwind::generate(['content' => $sanity['content'], 'css' => $cssInput, 'minify' => true]);
$stageTotalsSanity = [];
$actual = stagedGenerate($sanity['content'], $cssInput, $stageTotalsSanity);
echo 'Staged pipeline output parity: ' . ($expected === $actual ? 'IDENTICAL' : 'MISMATCH (' . strlen($expected) . ' vs ' . strlen($actual) . ' bytes)') . "\n\n";

echo "Per page, real workload shape: extractCandidates(full html) then generate(['content' => joined, 'minify' => true])\n";
printf("  %-14s %10s %10s %12s %12s %10s\n", 'page', 'html KB', 'classes', 'extract ms', 'generate ms', 'css KB');

$genTotalNs = 0;
$extractTotalNs = 0;
foreach ($pages as $page) {
    $s = hrtime(true);
    $css = Tailwind::generate(['content' => $page['content'], 'css' => $cssInput, 'minify' => true]);
    $genNs = hrtime(true) - $s;
    $genTotalNs += $genNs;
    $extractTotalNs += $page['extractFullHtmlNs'];
    printf(
        "  %-14s %10.1f %10d %12.2f %12.2f %10.1f\n",
        substr($page['file'], 0, 12),
        $page['bytes'] / 1024,
        $page['candidates'],
        ms($page['extractFullHtmlNs']),
        ms($genNs),
        strlen($css) / 1024,
    );
}
printf(
    "  mean: extract %.2f ms, generate %.2f ms per page (cold engine per call)\n\n",
    ms((int) ($extractTotalNs / count($pages))),
    ms((int) ($genTotalNs / count($pages))),
);

$runs = 3;
$stageTotals = [];
$pagesProfiled = 0;
for ($r = 0; $r < $runs; $r++) {
    foreach ($pages as $page) {
        stagedGenerate($page['content'], $cssInput, $stageTotals);
        $pagesProfiled++;
    }
}

echo "Stage breakdown, mean per page over {$pagesProfiled} cold generate() calls:\n";
$totalNs = array_sum($stageTotals);
uasort($stageTotals, fn ($a, $b) => $b <=> $a);
$ordered = $stageTotals;
ksort($ordered, SORT_NATURAL);
foreach ($ordered as $stage => $ns) {
    printf("  %-42s %8.2f ms  %5.1f%%\n", $stage, ms((int) ($ns / $pagesProfiled)), $ns * 100 / $totalNs);
}
printf("  %-42s %8.2f ms\n\n", 'TOTAL (staged pipeline)', ms((int) ($totalNs / $pagesProfiled)));

echo "Amortized: one Tailwind::compile(), then build() per page (warm design system):\n";
$s = hrtime(true);
$compiler = Tailwind::compile($cssInput);
$setupNs = hrtime(true) - $s;
printf("  compile() setup once: %.2f ms\n", ms($setupNs));
$warmTotal = 0;
foreach ($pages as $i => $page) {
    $s = hrtime(true);
    $css = $compiler->generate($page['content']);
    $min = CssMinifier::minify($css);
    $ns = hrtime(true) - $s;
    $warmTotal += $ns;
    if ($i < 3 || $i === count($pages) - 1) {
        printf("  page %2d build+minify: %8.2f ms (css %.1f KB)\n", $i + 1, ms($ns), strlen($min) / 1024);
    }
}
printf("  mean build+minify across %d pages: %.2f ms\n\n", count($pages), ms((int) ($warmTotal / count($pages))));

echo "Warm repeat on SAME compiler + same candidates (dedupe short-circuit):\n";
$s = hrtime(true);
$compiler->generate($pages[0]['content']);
printf("  repeat build, no new candidates: %.2f ms\n", ms(hrtime(true) - $s));

$union = [];
foreach ($pages as $page) {
    foreach (extractCandidates($page['content']) as $c) {
        $union[$c] = true;
    }
}
printf("\nCandidate stats: union across site = %d unique classes\n", count($union));
