<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

use function TailwindPHP\StateCache\compileCssCached;
use function TailwindPHP\StateCache\loadState;
use function TailwindPHP\StateCache\stateKey;

use TailwindPHP\TailwindCompiler;

/**
 * Tests for the persistent construction-state cache.
 */
class StateCacheTest extends TestCase
{
    private string $cacheDir;

    protected function setUp(): void
    {
        $this->cacheDir = sys_get_temp_dir() . '/tailwindphp_state_test_' . uniqid();
        mkdir($this->cacheDir, 0755, true);
    }

    protected function tearDown(): void
    {
        if (is_dir($this->cacheDir)) {
            $files = glob($this->cacheDir . '/*');
            if ($files) {
                foreach ($files as $file) {
                    if (is_file($file)) {
                        unlink($file);
                    }
                }
            }
            rmdir($this->cacheDir);
        }
    }

    /**
     * @return array<string, string>
     */
    private static function cssCases(): array
    {
        return [
            'default' => '@import "tailwindcss";',
            'theme-override' => '@import "tailwindcss"; @theme { --color-brand: #3b82f6; --spacing-huge: 7rem; }',
            'utility-apply' => '@import "tailwindcss"; @utility btn { @apply rounded-lg px-4 py-2 font-semibold; } .card { @apply border p-4; }',
            'custom-variant' => '@import "tailwindcss"; @custom-variant hocus (&:hover, &:focus);',
            'inline-source' => '@import "tailwindcss"; @source inline("underline");',
            'important' => '@import "tailwindcss" important;',
            'prefix' => '@import "tailwindcss" prefix(tw);',
        ];
    }

    /**
     * @return array<int, array<int, string>>
     */
    private static function candidateSets(): array
    {
        return [
            ['flex', 'p-4', 'bg-brand', 'text-white', 'btn', 'hocus:underline', 'p-huge', 'tw:flex'],
            ['grid', 'gap-4', 'sm:grid-cols-2', 'lg:grid-cols-4', 'rounded-lg', 'border-slate-200', 'hover:bg-red-500'],
            [],
        ];
    }

    #[Test]
    public function cached_construction_is_byte_identical_to_plain_construction(): void
    {
        foreach (self::cssCases() as $name => $css) {
            $cacheFile = $this->cacheDir . '/' . $name . '.php';

            $plain = new TailwindCompiler($css);
            $miss = new TailwindCompiler($css, ['stateCacheFile' => $cacheFile]);

            $this->assertFileExists($cacheFile, "state file for {$name}");

            $hit = new TailwindCompiler($css, ['stateCacheFile' => $cacheFile]);

            foreach (self::candidateSets() as $index => $candidates) {
                $expected = $plain->cssExact($candidates, true);

                $this->assertSame($expected, $miss->cssExact($candidates, true), "{$name} set {$index} miss parity");
                $this->assertSame($expected, $hit->cssExact($candidates, true), "{$name} set {$index} hit parity");

                $expectedPretty = $plain->cssExact($candidates, false);

                $this->assertSame($expectedPretty, $hit->cssExact($candidates, false), "{$name} set {$index} unminified hit parity");
            }
        }
    }

    #[Test]
    public function generate_matches_between_plain_and_cached_compilers(): void
    {
        $css = '@import "tailwindcss"; @theme { --color-brand: #10b981; }';
        $html = '<div class="flex bg-brand p-4 hover:underline sm:grid">x</div>';
        $cacheFile = $this->cacheDir . '/generate.php';

        $plain = new TailwindCompiler($css);
        new TailwindCompiler($css, ['stateCacheFile' => $cacheFile]);
        $hit = new TailwindCompiler($css, ['stateCacheFile' => $cacheFile]);

        $this->assertSame($plain->generateExact($html, true), $hit->generateExact($html, true));
    }

    #[Test]
    public function compilers_from_shared_state_stay_isolated(): void
    {
        $css = '@import "tailwindcss";';
        $cacheFile = $this->cacheDir . '/isolated.php';

        new TailwindCompiler($css, ['stateCacheFile' => $cacheFile]);

        $first = new TailwindCompiler($css, ['stateCacheFile' => $cacheFile]);
        $first->cssExact(['not-a-real-utility-zzz', 'flex'], true);

        $second = new TailwindCompiler($css, ['stateCacheFile' => $cacheFile]);

        $this->assertSame(
            (new TailwindCompiler($css))->cssExact(['flex', 'p-2'], true),
            $second->cssExact(['flex', 'p-2'], true),
        );
    }

    #[Test]
    public function corrupt_cache_file_recompiles(): void
    {
        $css = '@import "tailwindcss";';
        $cacheFile = $this->cacheDir . '/corrupt.php';

        file_put_contents($cacheFile, "<?php return 'garbage';\n");

        $compiler = new TailwindCompiler($css, ['stateCacheFile' => $cacheFile]);

        $this->assertSame(
            (new TailwindCompiler($css))->cssExact(['flex'], true),
            $compiler->cssExact(['flex'], true),
        );
    }

    #[Test]
    public function key_mismatch_is_a_miss(): void
    {
        $cssA = '@import "tailwindcss"; @theme { --color-brand: #111111; }';
        $cssB = '@import "tailwindcss"; @theme { --color-brand: #222222; }';
        $cacheFile = $this->cacheDir . '/keyed.php';

        new TailwindCompiler($cssA, ['stateCacheFile' => $cacheFile]);

        $this->assertNull(loadState($cacheFile, stateKey($cssB)));
        $this->assertNotNull(loadState($cacheFile, stateKey($cssA)));

        $compiler = new TailwindCompiler($cssB, ['stateCacheFile' => $cacheFile]);

        $this->assertSame(
            (new TailwindCompiler($cssB))->cssExact(['bg-brand'], true),
            $compiler->cssExact(['bg-brand'], true),
        );
    }

    #[Test]
    public function file_import_changes_invalidate_cached_state(): void
    {
        $importFile = $this->cacheDir . '/extra.css';
        file_put_contents($importFile, '@theme { --color-extra: #ff0001; }');

        $css = '@import "tailwindcss"; @import "./extra.css";';
        $options = ['importSearchPaths' => [$this->cacheDir], 'base' => $this->cacheDir];
        $cacheFile = $this->cacheDir . '/file-import.php';

        $first = compileCssCached($css, $cacheFile, $options);
        $expectedFirst = $first['buildExact'](['bg-extra'], true);

        file_put_contents($importFile, '@theme { --color-extra: #00ff02; }');
        touch($importFile, time() + 2);
        clearstatcache();

        $second = compileCssCached($css, $cacheFile, $options);

        $this->assertStringContainsString('--color-extra:#00ff02', $second['buildExact'](['bg-extra'], true));
        $this->assertStringContainsString('--color-extra:#ff0001', $expectedFirst);
    }
}
