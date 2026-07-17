<?php

declare(strict_types=1);

require __DIR__.'/../autoload.php';

use TailwindPHP\Tailwind;

$uploads = '/Users/dennis/Local Sites/fabrikat/app/public/wp-content/uploads';
$corpus = [];
foreach ([
    'glaze' => "$uploads/sites/334/divine/static-prerender",
    'divine' => "$uploads/sites/329/divine/static-prerender",
    'queuety' => "$uploads/sites/339/divine/static-prerender",
    'sleek' => "$uploads/sites/319/divine/static-prerender",
] as $site => $dir) {
    $files = glob("$dir/*.html") ?: [];
    usort($files, static fn ($a, $b) => filesize($b) <=> filesize($a));
    foreach ([0, (int) (count($files) / 2)] as $i) {
        if (isset($files[$i])) {
            $corpus["$site-".($i === 0 ? 'large' : 'median')] = $files[$i];
        }
    }
}

file_put_contents(__DIR__.'/fixtures/css-minimal.css', '@import "tailwindcss";'."\n");
copy('/Users/dennis/Local Sites/fabrikat/inline0/mono-theme/style.css', __DIR__.'/fixtures/theme-style.css');

foreach ($corpus as $name => $file) {
    $candidates = Tailwind::extractCandidates((string) file_get_contents($file));
    sort($candidates);
    file_put_contents(
        __DIR__."/fixtures/pages/$name.json",
        json_encode(['source' => basename($file), 'bytes' => filesize($file), 'candidates' => $candidates], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n",
    );
    echo "$name: ".count($candidates)." candidates\n";
}
