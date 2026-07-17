<?php

declare(strict_types=1);

require __DIR__.'/../autoload.php';

use TailwindPHP\Tailwind;

const COLD_RUNS = 5;
const WARM_RUNS = 5;
const REPEAT_RUNS = 20;
const BATCH_RUNS = 5;

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

function r(float $v): float
{
    return round($v, 3);
}

$inputs = [
    'minimal' => (string) file_get_contents(__DIR__.'/fixtures/css-minimal.css'),
    'theme' => '@import "tailwindcss";'."\n".file_get_contents(__DIR__.'/fixtures/theme-style.css'),
];

$fixtures = [];
foreach (glob(__DIR__.'/fixtures/pages/*.json') as $pageFile) {
    $page = json_decode((string) file_get_contents($pageFile), true);
    $name = basename($pageFile, '.json');
    $fixtures[$name] = [
        'candidates' => count($page['candidates']),
        'content' => '<div class="'.implode(' ', $page['candidates']).'"></div>',
    ];
}
ksort($fixtures);

Tailwind::generate(['content' => $fixtures['divine-median']['content'], 'css' => $inputs['theme'], 'minify' => true]);

$results = [
    'recorded' => date('c'),
    'commit' => trim((string) shell_exec('git -C '.escapeshellarg(dirname(__DIR__)).' rev-parse --short HEAD')),
    'branch' => trim((string) shell_exec('git -C '.escapeshellarg(dirname(__DIR__)).' rev-parse --abbrev-ref HEAD')),
    'php' => PHP_VERSION,
    'xdebug_mode' => getenv('XDEBUG_MODE') ?: '(unset)',
    'protocol' => [
        'cold' => 'Tailwind::generate minify=true, full pipeline per call, median of '.COLD_RUNS,
        'warm' => 'shared warm TailwindCompiler per css input, generateExact minify=true, median of '.WARM_RUNS,
        'repeat' => 'fresh compiler per fixture, generate once, then median of '.REPEAT_RUNS.' repeats of the same candidate set',
        'batch' => 'fresh compiler, all 8 fixtures sequentially via generateExact minify=true, median across '.BATCH_RUNS.' batch runs',
    ],
    'inputs' => array_map(fn ($css) => ['bytes' => strlen($css)], $inputs),
    'fixtures' => array_map(fn ($f) => ['candidates' => $f['candidates']], $fixtures),
];

foreach ($inputs as $inputName => $css) {
    foreach ($fixtures as $name => $fixture) {
        $samples = [];
        for ($i = 0; $i < COLD_RUNS; $i++) {
            $s = hrtime(true);
            Tailwind::generate(['content' => $fixture['content'], 'css' => $css, 'minify' => true]);
            $samples[] = ms(hrtime(true) - $s);
        }
        $results['cold_generate_ms'][$inputName][$name] = r(median($samples));
    }
    $results['cold_generate_ms'][$inputName]['_mean'] = r(array_sum($results['cold_generate_ms'][$inputName]) / count($fixtures));
}

foreach ($inputs as $inputName => $css) {
    $s = hrtime(true);
    $compiler = Tailwind::compile($css);
    $results['warm_compiler'][$inputName]['setup_ms'] = r(ms(hrtime(true) - $s));
    $compiler->generateExact($fixtures['divine-median']['content'], true);
    foreach ($fixtures as $name => $fixture) {
        $samples = [];
        for ($i = 0; $i < WARM_RUNS; $i++) {
            $s = hrtime(true);
            $compiler->generateExact($fixture['content'], true);
            $samples[] = ms(hrtime(true) - $s);
        }
        $results['warm_compiler'][$inputName]['per_page_exact_ms'][$name] = r(median($samples));
    }
    $perPage = $results['warm_compiler'][$inputName]['per_page_exact_ms'];
    $results['warm_compiler'][$inputName]['per_page_mean_ms'] = r(array_sum($perPage) / count($perPage));
}

foreach ($inputs as $inputName => $css) {
    foreach ($fixtures as $name => $fixture) {
        $compiler = Tailwind::compile($css);
        $compiler->generate($fixture['content'], true);
        foreach (['minify_off' => false, 'minify_on' => true] as $mode => $minify) {
            $samples = [];
            for ($i = 0; $i < REPEAT_RUNS; $i++) {
                $s = hrtime(true);
                $compiler->generate($fixture['content'], $minify);
                $samples[] = ms(hrtime(true) - $s);
            }
            $results['repeat_floor_ms'][$inputName][$name][$mode] = r(median($samples));
        }
    }
    foreach (['minify_off', 'minify_on'] as $mode) {
        $vals = array_column($results['repeat_floor_ms'][$inputName], $mode);
        $results['repeat_floor_ms'][$inputName]['_mean'][$mode] = r(array_sum($vals) / count($vals));
    }
}

foreach ($inputs as $inputName => $css) {
    $setups = [];
    $perPage = [];
    $totals = [];
    for ($i = 0; $i < BATCH_RUNS; $i++) {
        $s = hrtime(true);
        $compiler = Tailwind::compile($css);
        $setups[] = ms(hrtime(true) - $s);
        $batchStart = hrtime(true);
        foreach ($fixtures as $name => $fixture) {
            $s = hrtime(true);
            $compiler->generateExact($fixture['content'], true);
            $perPage[$name][] = ms(hrtime(true) - $s);
        }
        $totals[] = ms(hrtime(true) - $batchStart);
    }
    $results['batch'][$inputName]['setup_ms'] = r(median($setups));
    foreach ($perPage as $name => $samples) {
        $results['batch'][$inputName]['per_page_ms'][$name] = r(median($samples));
    }
    $results['batch'][$inputName]['pages_total_ms'] = r(median($totals));
    $results['batch'][$inputName]['total_with_setup_ms'] = r(median($setups) + median($totals));
    $results['batch'][$inputName]['per_page_mean_ms'] = r(median($totals) / count($fixtures));
}

$results['baseline_pre_program'] = [
    'source' => 'mono-theme prds/014_RENDER_ENGINE_AND_STACK_DEEP_DIVE.md Finding 3 and 014_reports/tailwindphp-deep-dive-raw.json verify table, xdebug off, same machine',
    'variance' => 'baseline documented +/-10% run-to-run variance and this file records single-run medians, so treat every ratio below as approximate',
    'cold_generate_ms' => 66.0,
    'warm_first_visit_per_page_ms_range' => [9.0, 30.0],
    'warm_repeat_minify_on_ms' => 8.0,
    'warm_repeat_minify_off_ms' => 0.9,
];

$results['comparison'] = [
    'notes' => [
        'cold' => 'cold_theme_mean vs the 66 ms baseline; the delta sits inside the baseline run variance, and cold still rebuilds the invariant prefix',
        'warm_first_visit' => 'batch per_page medians are the like-for-like first-visit pair against the 9-30 ms baseline range; the ratio divides by the conservative 9 ms low end',
        'warm_memoized' => 'warm_compiler per_page_exact medians re-run the same candidate set, so samples after the first hit the design-system candidate memos; they have no pre-program analogue and get no baseline ratio',
        'repeat' => 'repeat floor pairs against the old warm-repeat floor of ~8 ms minified and 0.9 ms unminified',
    ],
    'cold_theme_mean_vs_baseline' => r($results['cold_generate_ms']['theme']['_mean'] / 66.0),
    'batch_theme_first_visit_vs_baseline_low_end' => r($results['batch']['theme']['per_page_mean_ms'] / 9.0),
    'repeat_theme_minify_on_vs_baseline' => r($results['repeat_floor_ms']['theme']['_mean']['minify_on'] / 8.0),
    'repeat_theme_minify_off_vs_baseline' => r($results['repeat_floor_ms']['theme']['_mean']['minify_off'] / 0.9),
];

file_put_contents(__DIR__.'/results-engine-program.json', json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n");

printf("%-15s %5s | %8s %8s | %8s %8s | %9s %9s | %9s %9s\n", 'fixture', 'cand', 'cold-min', 'cold-thm', 'warm-min', 'warm-thm', 'rpt-off-t', 'rpt-on-t', 'batch-min', 'batch-thm');
foreach ($fixtures as $name => $fixture) {
    printf(
        "%-15s %5d | %8.2f %8.2f | %8.2f %8.2f | %9.3f %9.3f | %9.2f %9.2f\n",
        $name,
        $fixture['candidates'],
        $results['cold_generate_ms']['minimal'][$name],
        $results['cold_generate_ms']['theme'][$name],
        $results['warm_compiler']['minimal']['per_page_exact_ms'][$name],
        $results['warm_compiler']['theme']['per_page_exact_ms'][$name],
        $results['repeat_floor_ms']['theme'][$name]['minify_off'],
        $results['repeat_floor_ms']['theme'][$name]['minify_on'],
        $results['batch']['minimal']['per_page_ms'][$name],
        $results['batch']['theme']['per_page_ms'][$name],
    );
}
printf(
    "means: cold min %.2f thm %.2f | warm min %.2f thm %.2f | repeat thm off %.3f on %.3f | batch thm total %.2f (+setup %.2f)\n",
    $results['cold_generate_ms']['minimal']['_mean'],
    $results['cold_generate_ms']['theme']['_mean'],
    $results['warm_compiler']['minimal']['per_page_mean_ms'],
    $results['warm_compiler']['theme']['per_page_mean_ms'],
    $results['repeat_floor_ms']['theme']['_mean']['minify_off'],
    $results['repeat_floor_ms']['theme']['_mean']['minify_on'],
    $results['batch']['theme']['pages_total_ms'],
    $results['batch']['theme']['setup_ms'],
);
