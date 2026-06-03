<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\TestCase;
use TailwindPHP\Tailwind;

class IssueRegressionTest extends TestCase
{
    public function test_infer_data_type_dispatch_survives_vendor_namespace_prefixing(): void
    {
        $tempDir = sys_get_temp_dir() . '/tailwindphp-prefix-' . bin2hex(random_bytes(6));
        mkdir($tempDir);

        try {
            foreach (['segment.php', 'math-operators.php', 'is-color.php', 'infer-data-type.php'] as $file) {
                $source = file_get_contents(__DIR__ . '/../src/utils/' . $file);
                $source = str_replace(
                    'namespace TailwindPHP\\Utils;',
                    'namespace ScopedVendor\\TailwindPHP\\Utils;',
                    $source,
                );
                file_put_contents($tempDir . '/' . $file, $source);
            }

            file_put_contents(
                $tempDir . '/run.php',
                <<<'PHP'
<?php

declare(strict_types=1);

require __DIR__ . '/segment.php';
require __DIR__ . '/math-operators.php';
require __DIR__ . '/is-color.php';
require __DIR__ . '/infer-data-type.php';

use function ScopedVendor\TailwindPHP\Utils\inferDataType;

$cases = [
    ['15px', ['color', 'length'], 'length'],
    ['#ff0000', ['color', 'length'], 'color'],
    ['50%', ['percentage', 'length'], 'percentage'],
];

foreach ($cases as [$value, $types, $expected]) {
    $actual = inferDataType($value, $types);

    if ($actual !== $expected) {
        fwrite(STDERR, "{$value}: expected {$expected}, got " . var_export($actual, true) . PHP_EOL);
        exit(1);
    }
}
PHP,
            );

            $output = [];
            $exitCode = 0;
            exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($tempDir . '/run.php') . ' 2>&1', $output, $exitCode);

            $this->assertSame(0, $exitCode, implode("\n", $output));
        } finally {
            foreach (glob($tempDir . '/*') ?: [] as $file) {
                unlink($file);
            }
            rmdir($tempDir);
        }
    }

    public function test_minified_arbitrary_math_values_preserve_function_spacing(): void
    {
        $css = Tailwind::generate([
            'content' => '<div class="h-[clamp(9.375rem,7.635rem_+_8.699vw,15.8125rem)] w-[calc(100%_+_10px)] mb-[min(1rem_+_2vw,3rem)]"></div>',
            'css' => '@import "tailwindcss/utilities";',
            'minify' => true,
        ]);

        $this->assertStringContainsString(
            'height:clamp(9.375rem, 7.635rem + 8.699vw, 15.8125rem)',
            $css,
        );
        $this->assertStringContainsString('width:calc(100% + 10px)', $css);
        $this->assertStringContainsString('margin-bottom:min(1rem + 2vw, 3rem)', $css);
        $this->assertStringNotContainsString('7.635rem+8.699vw', $css);
        $this->assertStringNotContainsString('7.635rem + 8.699vw,15.8125rem', $css);
    }

    public function test_encoded_ampersands_in_class_attributes_are_decoded_before_candidate_extraction(): void
    {
        $raw = '<div class="[&_svg:not([class*=size-])]:size-4"></div>';
        $encoded = '<div class="[&amp;_svg:not([class*=size-])]:size-4"></div>';

        $this->assertSame(
            Tailwind::extractCandidates($raw),
            Tailwind::extractCandidates($encoded),
        );
        $this->assertSame(
            ['[&_svg:not([class*=size-])]:size-4'],
            Tailwind::extractCandidates($encoded),
        );
    }

    public function test_encoded_ampersand_arbitrary_selector_classes_generate_css(): void
    {
        $css = Tailwind::generate([
            'content' => '<a class="inline-flex [&amp;_svg:not([class*=size-])]:size-4"><svg width="24" height="24"></svg></a>',
            'css' => '@import "tailwindcss/utilities";',
            'minify' => true,
        ]);

        $this->assertStringContainsString('svg:not([class*=size-])', $css);
        $this->assertStringContainsString('width:calc(var(--spacing) * 4)', $css);
        $this->assertStringContainsString('height:calc(var(--spacing) * 4)', $css);
    }

    public function test_full_tailwind_import_preserves_canonical_layer_order(): void
    {
        $css = Tailwind::generate([
            'content' => '<div class="text-red-500"></div>',
            'css' => '@import "tailwindcss"; @layer base { .text-red-500 { color: blue; } }',
            'minify' => false,
        ]);

        $layerOrder = strpos($css, '@layer theme, base, components, utilities;');
        $baseLayer = strpos($css, '@layer base');
        $utilitiesLayer = strpos($css, '@layer utilities');
        $customBaseLayer = strrpos($css, '@layer base');

        $this->assertNotFalse($layerOrder);
        $this->assertNotFalse($baseLayer);
        $this->assertNotFalse($utilitiesLayer);
        $this->assertNotFalse($customBaseLayer);

        $this->assertLessThan($baseLayer, $layerOrder);
        $this->assertLessThan($utilitiesLayer, $layerOrder);
        $this->assertLessThan($customBaseLayer, $layerOrder);
        $this->assertMatchesRegularExpression('/@layer utilities\s*\{[^}]*\.text-red-500/s', $css);
    }
}
