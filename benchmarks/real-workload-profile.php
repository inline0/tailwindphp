<?php

declare(strict_types=1);

$rootDir = dirname(__DIR__);
require_once $rootDir . '/vendor/autoload.php';

use function TailwindPHP\Ast\toCss;
use function TailwindPHP\Compile\compileCandidates;
use function TailwindPHP\CssParser\parse;
use function TailwindPHP\extractCandidates;
use function TailwindPHP\parseCss;
use function TailwindPHP\optimizeAst;
use function TailwindPHP\substituteAtApply;
use function TailwindPHP\substituteFunctions;
use function TailwindPHP\Walk\walk;

use TailwindPHP\Minifier\CssMinifier;
use TailwindPHP\Tailwind;
use TailwindPHP\Walk\WalkAction;

use const TailwindPHP\FEATURE_NONE;
use const TailwindPHP\POLYFILL_ALL;

const UPLOADS = '/Users/dennis/Local Sites/fabrikat/app/public/wp-content/uploads/sites';
const STYLE_CSS = '/Users/dennis/Local Sites/fabrikat/inline0/mono-theme/style.css';

const CORPUS = [
    ['small',  'glaze-min',    334, 'c4d100809dc30fb626ec9247da63c665262b0cb1b2de0a7d3a8a9955a726fe64.html'],
    ['small',  'site330',      330, 'a8ac7ff8e1acc7b9e10231b9b222908cf5f47a56fe9f7f32c9098342dcf7886f.html'],
    ['small',  'site333-s',    333, '98b9216b4ce1b44964930a609c6c5ddbd39e1d40d743ace9ec282e3c3b693d42.html'],
    ['medium', 'divine-p30',   319, '524a5a1c055ecc9be6a9eb422150c0c9e8e8362229e64370e7af5181695ab3bf.html'],
    ['medium', 'divine-p50',   319, '2c73b8362cfdcb3dc1616af3770787689f4504724c2c3ea8315a44196cfb07a4.html'],
    ['medium', 'divine-p70',   319, 'dc0aa09637cffd3d7066187d41b36dbcb7853aadf38a9359b4c7a82dd2674514.html'],
    ['medium', 'site333-p90',  333, '991c4472371f0d7f213e5603cce5605400f873fc62fc5962e63f47b68fa89f6f.html'],
    ['large',  'divine-max',   319, '55d4ef0362de00c13964e7687974b623102f53829d05275a5198e55fb8976221.html'],
    ['large',  'site333-max',  333, '623e9cb9591adc679d6cb8beac6baff55e70c13999a6dd6bff6008437750f7ae.html'],
    ['large',  'site339-max',  339, '46b936f63ce2b646855f414650b38448ed40be1cde6c0363b2586a0d53073b86.html'],
];

function ms(int|float $ns): float
{
    return $ns / 1e6;
}

function median(array $values): float
{
    sort($values);
    $n = count($values);

    return $n % 2 ? $values[intdiv($n, 2)] : ($values[intdiv($n, 2) - 1] + $values[intdiv($n, 2)]) / 2;
}

function buildCssInput(): string
{
    return '@import "tailwindcss";' . "\n" . file_get_contents(STYLE_CSS);
}

function filterCandidates(array $candidates): array
{
    $candidates = array_values(array_filter($candidates, fn ($c) => !is_numeric($c)));
    sort($candidates);

    return $candidates;
}

function candidatesToContent(array $candidates): string
{
    return '<div class="' . implode(' ', $candidates) . '"></div>';
}

function stagedGenerate(string $content, string $cssInput, array &$stageNs): string
{
    $t = [];
    $mark = function (string $stage, int $start) use (&$t) {
        $t[$stage] = ($t[$stage] ?? 0) + (hrtime(true) - $start);
    };

    $s = hrtime(true);
    $candidates = extractCandidates($content);
    $mark('02 extractCandidates(candidate div)', $s);

    $s = hrtime(true);
    $ast = parse($cssInput);
    $mark('03 parse(css input = import+style.css)', $s);

    $s = hrtime(true);
    $result = parseCss($ast, []);
    $mark('04 parseCss: import expansion + design system', $s);

    $designSystem = $result['designSystem'];
    $features = $result['features'];

    $s = hrtime(true);
    $features |= substituteFunctions($ast, $designSystem);
    $mark('05 substituteFunctions(root ast)', $s);

    $s = hrtime(true);
    $features |= substituteAtApply($ast, $designSystem);
    $mark('06 substituteAtApply(root ast)', $s);

    $s = hrtime(true);
    walk($ast, function (&$node) {
        if ($node['kind'] !== 'at-rule') {
            return WalkAction::Continue;
        }
        if ($node['name'] === '@utility') {
            return WalkAction::Replace([]);
        }

        return WalkAction::Skip;
    });
    $mark('07 strip @utility nodes', $s);

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
    $mark('08 compileCandidates', $s);

    $s = hrtime(true);
    substituteFunctions($newNodes, $designSystem);
    $mark('09 substituteFunctions(utility nodes)', $s);

    $s = hrtime(true);
    walk($ast, function (&$node) use ($newNodes) {
        if ($node['kind'] === 'context' && isset($node['context']) && is_array($node['context'])) {
            $node['nodes'] = $newNodes;

            return WalkAction::Stop;
        }

        return WalkAction::Continue;
    });
    $mark('10 inject utility nodes', $s);

    $s = hrtime(true);
    $compiled = optimizeAst($ast, $designSystem, POLYFILL_ALL);
    $mark('11 optimizeAst incl LightningCss', $s);

    $s = hrtime(true);
    $css = toCss($compiled);
    $mark('12 toCss', $s);

    $s = hrtime(true);
    $min = CssMinifier::minify($css);
    $mark('13 CssMinifier::minify', $s);

    foreach ($t as $stage => $ns) {
        $stageNs[$stage][] = $ns;
    }

    return $min;
}

function loadCorpus(): array
{
    $pages = [];
    foreach (CORPUS as [$class, $label, $site, $file]) {
        $path = UPLOADS . "/{$site}/divine/static-prerender/{$file}";
        $html = file_get_contents($path);
        if ($html === false) {
            fwrite(STDERR, "missing corpus page {$path}\n");
            exit(1);
        }
        $pages[] = [
            'class' => $class,
            'label' => $label,
            'site' => $site,
            'bytes' => strlen($html),
            'html' => $html,
        ];
    }

    return $pages;
}

$mode = $argv[1] ?? 'profile';
$cssInput = buildCssInput();

if ($mode === 'repeat') {
    $idx = (int) ($argv[2] ?? 4);
    $reps = (int) ($argv[3] ?? 8);
    $pages = loadCorpus();
    $page = $pages[$idx];
    $out = [];
    for ($i = 0; $i < $reps; $i++) {
        $s = hrtime(true);
        $candidates = filterCandidates(Tailwind::extractCandidates($page['html']));
        $css = Tailwind::generate([
            'content' => candidatesToContent($candidates),
            'css' => $cssInput,
            'minify' => true,
        ]);
        $out[] = round(ms(hrtime(true) - $s), 2);
    }
    echo json_encode(['page' => $page['label'], 'runs_ms' => $out, 'css_bytes' => strlen($css)]) . "\n";
    exit(0);
}

if ($mode === 'repeat-bare') {
    $idx = (int) ($argv[2] ?? 4);
    $reps = (int) ($argv[3] ?? 8);
    $pages = loadCorpus();
    $page = $pages[$idx];
    $bare = '@import "tailwindcss";';
    $out = [];
    for ($i = 0; $i < $reps; $i++) {
        $s = hrtime(true);
        $candidates = filterCandidates(Tailwind::extractCandidates($page['html']));
        $css = Tailwind::generate([
            'content' => candidatesToContent($candidates),
            'css' => $bare,
            'minify' => true,
        ]);
        $out[] = round(ms(hrtime(true) - $s), 2);
    }
    echo json_encode(['page' => $page['label'], 'runs_ms' => $out, 'css_bytes' => strlen($css)]) . "\n";
    exit(0);
}

$runs = (int) ($argv[2] ?? 5);
$pages = loadCorpus();

printf("css input: %.1f KB (@import \"tailwindcss\"; + newline + style.css)\n", strlen($cssInput) / 1024);
printf("runs per measurement: %d (median reported)\n\n", $runs);

foreach ($pages as $i => $page) {
    $candidates = filterCandidates(Tailwind::extractCandidates($page['html']));
    $pages[$i]['candidates'] = count($candidates);
    $pages[$i]['content'] = candidatesToContent($candidates);
}

$expected = Tailwind::generate(['content' => $pages[0]['content'], 'css' => $cssInput, 'minify' => true]);
$sanityNs = [];
$actual = stagedGenerate($pages[0]['content'], $cssInput, $sanityNs);
echo 'staged pipeline parity vs Tailwind::generate: '
    . ($expected === $actual ? 'IDENTICAL' : 'MISMATCH ' . strlen($expected) . ' vs ' . strlen($actual))
    . "\n\n";

foreach ($pages as $i => $page) {
    $extractNs = [];
    $filterNs = [];
    $genNs = [];
    for ($r = 0; $r < $runs; $r++) {
        $s = hrtime(true);
        $raw = Tailwind::extractCandidates($page['html']);
        $extractNs[] = hrtime(true) - $s;

        $s = hrtime(true);
        $filtered = filterCandidates($raw);
        $filterNs[] = hrtime(true) - $s;

        $s = hrtime(true);
        $css = Tailwind::generate(['content' => $page['content'], 'css' => $cssInput, 'minify' => true]);
        $genNs[] = hrtime(true) - $s;
    }
    $pages[$i]['extractMs'] = ms(median($extractNs));
    $pages[$i]['filterMs'] = ms(median($filterNs));
    $pages[$i]['generateMs'] = ms(median($genNs));
    $pages[$i]['cssBytes'] = strlen($css);
}

echo "per page (warmed process, full cold pipeline per call, median of {$runs}):\n";
printf(
    "  %-7s %-12s %8s %6s %10s %10s %12s %8s\n",
    'class',
    'page',
    'html KB',
    'cand',
    'extract ms',
    'filter ms',
    'generate ms',
    'css KB'
);
foreach ($pages as $page) {
    printf(
        "  %-7s %-12s %8.1f %6d %10.2f %10.3f %12.2f %8.1f\n",
        $page['class'],
        $page['label'],
        $page['bytes'] / 1024,
        $page['candidates'],
        $page['extractMs'],
        $page['filterMs'],
        $page['generateMs'],
        $page['cssBytes'] / 1024
    );
}

$byClass = [];
foreach ($pages as $page) {
    $byClass[$page['class']][] = $page;
}
echo "\nsize-class means:\n";
foreach ($byClass as $class => $rows) {
    printf(
        "  %-7s pages=%d  html %.0f KB  cand %.0f  extract %.2f ms  generate %.2f ms\n",
        $class,
        count($rows),
        array_sum(array_column($rows, 'bytes')) / count($rows) / 1024,
        array_sum(array_column($rows, 'candidates')) / count($rows),
        array_sum(array_column($rows, 'extractMs')) / count($rows),
        array_sum(array_column($rows, 'generateMs')) / count($rows)
    );
}

$stageByClass = [];
foreach ($pages as $page) {
    $stageNs = [];
    for ($r = 0; $r < $runs; $r++) {
        stagedGenerate($page['content'], $cssInput, $stageNs);
    }
    foreach ($stageNs as $stage => $samples) {
        $stageByClass[$page['class']][$stage][] = ms(median($samples));
        $stageByClass['ALL'][$stage][] = ms(median($samples));
    }
}

echo "\nstage medians (ms, median of {$runs} per page, then mean across pages in class):\n";
$stages = array_keys($stageByClass['ALL']);
sort($stages);
printf("  %-44s %8s %8s %8s %8s %6s\n", 'stage', 'small', 'medium', 'large', 'ALL', '%');
$allTotal = 0;
foreach ($stages as $stage) {
    $allTotal += array_sum($stageByClass['ALL'][$stage]) / count($stageByClass['ALL'][$stage]);
}
foreach ($stages as $stage) {
    $cells = [];
    foreach (['small', 'medium', 'large', 'ALL'] as $class) {
        $vals = $stageByClass[$class][$stage] ?? [];
        $cells[] = $vals ? array_sum($vals) / count($vals) : 0.0;
    }
    printf(
        "  %-44s %8.2f %8.2f %8.2f %8.2f %5.1f%%\n",
        $stage,
        $cells[0],
        $cells[1],
        $cells[2],
        $cells[3],
        $cells[3] * 100 / $allTotal
    );
}
printf("  %-44s %35s %8.2f\n", 'TOTAL staged', '', $allTotal);

echo "\namortization: one TailwindCompiler, sequential first-visit build+minify per page:\n";
$s = hrtime(true);
$compiler = Tailwind::compile($cssInput);
printf("  compiler setup once: %.2f ms\n", ms(hrtime(true) - $s));
foreach ($pages as $page) {
    $s = hrtime(true);
    $css = $compiler->generate($page['content']);
    $min = CssMinifier::minify($css);
    $ns = hrtime(true) - $s;
    printf(
        "  %-7s %-12s first-visit warm build+minify %8.2f ms  css %6.1f KB (cold exact css %6.1f KB, cold %8.2f ms)\n",
        $page['class'],
        $page['label'],
        ms($ns),
        strlen($min) / 1024,
        $page['cssBytes'] / 1024,
        $page['generateMs']
    );
}
echo "  second pass, all candidates already accumulated:\n";
foreach ($pages as $page) {
    $s = hrtime(true);
    $css = $compiler->generate($page['content']);
    $min = CssMinifier::minify($css);
    printf("  %-7s %-12s repeat build+minify %8.2f ms\n", $page['class'], $page['label'], ms(hrtime(true) - $s));
}
$s = hrtime(true);
$compiler->generate($pages[0]['content']);
printf("  repeat same candidates, no minify: %.2f ms\n", ms(hrtime(true) - $s));
