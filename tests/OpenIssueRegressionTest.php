<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use TailwindPHP\Cli\Application;
use TailwindPHP\Cli\Console\Input;
use TailwindPHP\Plugin\PluginAPI;
use TailwindPHP\Plugin\PluginInterface;
use TailwindPHP\tw;

final class OpenIssueRegressionTest extends TestCase
{
    private string $workspace;

    protected function setUp(): void
    {
        $this->workspace = sys_get_temp_dir() . '/tailwindphp-issues-' . bin2hex(random_bytes(6));
        mkdir($this->workspace);
    }

    protected function tearDown(): void
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->workspace, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );
        foreach ($iterator as $entry) {
            if ($entry->isDir()) {
                rmdir($entry->getPathname());
            } else {
                unlink($entry->getPathname());
            }
        }
        rmdir($this->workspace);
    }

    #[Test]
    public function itConsumesLongOptionValuesAndRecognizesStdin(): void
    {
        $input = new Input(['tailwindphp', '--input', 'in put.css', '--output', 'output.css', '--cwd', '/tmp']);
        self::assertSame('in put.css', $input->getStringOption('input'));
        self::assertSame('output.css', $input->getStringOption('output'));
        self::assertSame('/tmp', $input->getStringOption('cwd'));
        self::assertSame('', $input->getCommand());
        self::assertSame('-', (new Input(['tailwindphp', '-i', '-']))->getStringOption('i'));

        $css = '@import "tailwindcss/utilities.css"; @source inline("flex");';
        file_put_contents($this->workspace . '/in put.css', $css);
        $result = $this->runCli(['--input', 'in put.css', '--output', 'output.css']);
        self::assertSame(0, $result['exit'], $result['stderr']);
        self::assertStringContainsString('.flex', file_get_contents($this->workspace . '/output.css'));
        $stdin = $this->runCli(['-i', '-', '--output', '-'], $css);
        self::assertSame(0, $stdin['exit'], $stdin['stderr']);
        self::assertStringContainsString('.flex', $stdin['stdout']);
        $invalid = $this->runCli(['--input']);
        self::assertSame(1, $invalid['exit']);
        self::assertStringContainsString('requires a value', $invalid['stderr']);
    }

    #[Test]
    public function itOptimizesWithoutMinifying(): void
    {
        file_put_contents(
            $this->workspace . '/input.css',
            '@import "tailwindcss/utilities.css"; @source inline("flex");',
        );
        $optimized = $this->runCli(['-i', 'input.css', '--optimize']);
        $minified = $this->runCli(['-i', 'input.css', '--minify']);
        self::assertSame(0, $optimized['exit']);
        self::assertSame(0, $minified['exit']);
        self::assertStringContainsString("  display: flex;\n", $optimized['stdout']);
        self::assertStringContainsString('.flex{display:flex}', $minified['stdout']);
        self::assertNotSame($optimized['stdout'], $minified['stdout']);
    }

    #[Test]
    public function itKeepsCssMixinApplyRulesInsideTheirParent(): void
    {
        $compiler = \TailwindPHP\compile(
            '.foo { @apply underline; @apply --my-mixin-1; @apply --my-mixin-1 --my-mixin-2;'
            . ' @apply --my-mixin-3 { color: red; } }',
        );
        self::assertSame(
            ".foo {\n  text-decoration-line: underline;\n  @apply --my-mixin-1;\n"
            . "  @apply --my-mixin-1 --my-mixin-2;\n  @apply --my-mixin-3 {\n    color: red;\n  }\n}\n",
            $compiler['build']([]),
        );
        $distinct = \TailwindPHP\compile('.a { @apply --first; } .b { @apply --second; }');
        self::assertSame(".a {\n  @apply --first;\n}\n.b {\n  @apply --second;\n}\n", $distinct['build']([]));
    }

    #[Test]
    public function itAppliesPluginSelectorsAndValueVariants(): void
    {
        \TailwindPHP\registerPlugin(new class () implements PluginInterface {
            public function getName(): string
            {
                return 'issue-variants';
            }

            public function __invoke(PluginAPI $api, array $options = []): void
            {
                $api->addVariant('issue-hocus', '&:hover, &:focus');
                $api->addVariant('issue-focus', ['&:focus', '&:focus-visible']);
                $api->matchVariant('issue-dir', fn ($value) => '&[dir="' . $value . '"]', ['values' => ['start' => 'ltr']]);
            }

            public function getThemeExtensions(array $options = []): array
            {
                return [];
            }
        });
        $css = tw::generate(
            '<div class="issue-hocus:flex issue-focus:flex issue-dir-start:flex">',
            '@plugin "issue-variants"; @import "tailwindcss/utilities.css";',
        );
        self::assertStringContainsString('.issue-hocus\\:flex:hover', $css);
        self::assertStringContainsString('.issue-hocus\\:flex:focus', $css);
        self::assertStringContainsString('.issue-focus\\:flex:focus-visible', $css);
        self::assertStringContainsString('.issue-dir-start\\:flex[dir="ltr"]', $css);
    }

    #[Test]
    public function itUsesReferenceThemesRegardlessOfImportOrder(): void
    {
        $reference = '@media reference { @theme { --color-brand: #f00; } }';
        $utilities = '@import "tailwindcss/utilities.css";';
        $before = tw::generate('<div class="bg-brand flex">', $reference . $utilities);
        $after = tw::generate('<div class="bg-brand flex">', $utilities . $reference);
        self::assertSame($after, $before);
        self::assertStringContainsString('.flex', $before);
        self::assertStringContainsString('var(--color-brand, #f00)', $before);
        self::assertStringNotContainsString(':root', $before);

        file_put_contents($this->workspace . '/ref.css', '@theme { --color-brand: #f00; }');
        foreach (['@import "ref.css" reference;' . $utilities, $utilities . '@import "ref.css" reference;'] as $input) {
            $compiler = \TailwindPHP\compile($input, ['importSearchPaths' => [$this->workspace]]);
            self::assertSame($before, $compiler['build'](['bg-brand', 'flex']));
        }
    }

    #[Test]
    public function itEmitsOnlyRingOffsetVariablesForRingOffsetUtilities(): void
    {
        $offsetShadow = 'var(--tw-ring-inset, ) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)';
        $css = tw::generate(
            '<div class="ring-offset-2 ring-offset-[3px] ring-offset-red-500">',
            '@import "tailwindcss/utilities.css";',
        );
        self::assertSame(
            ".ring-offset-2 {\n  --tw-ring-offset-width: 2px;\n  --tw-ring-offset-shadow: {$offsetShadow};\n}\n"
            . ".ring-offset-\\[3px\\] {\n  --tw-ring-offset-width: 3px;\n  --tw-ring-offset-shadow: {$offsetShadow};\n}\n"
            . ".ring-offset-red-500 {\n  --tw-ring-offset-color: var(--color-red-500);\n}\n",
            $css,
        );
    }

    #[Test]
    public function itSuppressesReferenceVirtualModulesWhileKeepingApplyAvailable(): void
    {
        $css = tw::generate(
            '<div class="flex">',
            '@import "tailwindcss" reference; .btn { @apply bg-blue-500 px-4; }',
        );
        self::assertStringContainsString('.btn', $css);
        self::assertStringContainsString('background-color:', $css);
        self::assertStringNotContainsString('.flex', $css);
        self::assertStringNotContainsString('@layer', $css);
        foreach (['theme.css', 'utilities.css', 'preflight.css'] as $module) {
            self::assertSame('', tw::generate('<div class="flex">', '@import "tailwindcss/' . $module . '" reference;'));
        }
        $combined = tw::generate(
            '<div class="flex">',
            '@import "tailwindcss" reference; @import "tailwindcss/utilities.css";',
        );
        self::assertStringContainsString('.flex', $combined);
        self::assertStringNotContainsString('@layer', $combined);
        foreach ([
            '@import "tailwindcss/utilities.css" reference; @import "tailwindcss/utilities.css";',
            '@import "tailwindcss/utilities.css"; @import "tailwindcss/utilities.css" reference;',
        ] as $input) {
            self::assertStringContainsString('.flex', tw::generate('<div class="flex">', $input));
        }
    }

    #[Test]
    public function itScansOnlyMatchingSourcePathsAndAppliesExclusionsToWatching(): void
    {
        mkdir($this->workspace . '/src/legacy', 0755, true);
        mkdir($this->workspace . '/templates/deep', 0755, true);
        file_put_contents($this->workspace . '/templates/a.html', '<div class="text-center">');
        file_put_contents($this->workspace . '/templates/deep/b.html', '<div class="font-bold">');
        file_put_contents($this->workspace . '/src/inside.html', '<div class="italic">');
        file_put_contents($this->workspace . '/src/legacy/old.html', '<div class="uppercase">');
        foreach ([
            '../templates' => true,
            '../templates/*.html' => false,
            '../templates/**/*.html' => true,
            '../templates/[ab].html' => false,
            '../templates/{a,b}.html' => false,
        ] as $pattern => $nested) {
            file_put_contents(
                $this->workspace . '/src/app.css',
                '@import "tailwindcss/utilities.css"; @source "' . $pattern . '";',
            );
            $result = $this->runCli(['--input', 'src/app.css']);
            self::assertSame(0, $result['exit'], $result['stderr']);
            self::assertStringContainsString('.text-center', $result['stdout']);
            self::assertSame($nested, str_contains($result['stdout'], '.font-bold'));
            self::assertStringNotContainsString('.italic', $result['stdout']);
            self::assertStringNotContainsString('.uppercase', $result['stdout']);
        }
        $input = '@import "tailwindcss/utilities.css"; @source not "./legacy"; @source "./";';
        file_put_contents($this->workspace . '/src/app.css', $input);
        $result = $this->runCli(['-i', 'src/app.css']);
        self::assertSame(0, $result['exit'], $result['stderr']);
        self::assertStringContainsString('.italic', $result['stdout']);
        self::assertStringNotContainsString('.uppercase', $result['stdout']);
        self::assertStringNotContainsString('.text-center', $result['stdout']);
        $compiled = \TailwindPHP\compile($input, ['base' => $this->workspace . '/src']);
        $method = new \ReflectionMethod(Application::class, 'getWatchFiles');
        $files = $method->invoke(new Application(new Input(['tailwindphp'])), $compiled['sources']);
        self::assertContains($this->workspace . '/src/inside.html', $files);
        self::assertNotContains($this->workspace . '/src/legacy/old.html', $files);
        self::assertNotContains($this->workspace . '/templates/a.html', $files);
    }

    #[Test]
    public function itWatchesIncludedFilesWithoutRebuildingForExcludedFilesOrItsOutput(): void
    {
        if (!function_exists('pcntl_signal')) {
            self::markTestSkipped('Signal handling is needed to stop the watch subprocess.');
        }
        mkdir($this->workspace . '/src');
        mkdir($this->workspace . '/templates/ignored', 0755, true);
        $template = $this->workspace . '/templates/a.html';
        $ignored = $this->workspace . '/templates/ignored/a.html';
        $output = $this->workspace . '/templates/output.css';
        $log = $this->workspace . '/watch.log';
        file_put_contents($template, '<div class="flex">');
        file_put_contents($ignored, '<div class="uppercase">');
        file_put_contents(
            $this->workspace . '/src/app.css',
            '@import "tailwindcss/utilities.css"; @source "../templates"; @source not "../templates/ignored";',
        );
        $process = proc_open(
            [PHP_BINARY, dirname(__DIR__) . '/bin/tailwindphp', '-i', 'src/app.css', '-o', 'templates/output.css', '--watch', '--optimize'],
            [0 => ['pipe', 'r'], 1 => ['file', $this->workspace . '/watch.stdout', 'w'], 2 => ['file', $log, 'w']],
            $pipes,
            $this->workspace,
        );
        self::assertIsResource($process);
        fclose($pipes[0]);
        try {
            $this->waitForContents($log, 'Watching for changes...');
            $this->waitForContents($output, '.flex');
            file_put_contents($template, '<div class="italic">');
            touch($template, time() + 2);
            $this->waitForContents($output, '.italic');
            $this->waitForContents($log, 'Done in', 2);
            self::assertStringNotContainsString('.flex', file_get_contents($output));
            self::assertStringContainsString("  font-style: italic;\n", file_get_contents($output));
            $before = substr_count(file_get_contents($log), 'Done in');
            file_put_contents($ignored, '<div class="lowercase">');
            touch($ignored, time() + 4);
            usleep(1100000);
            self::assertSame($before, substr_count(file_get_contents($log), 'Done in'));
            self::assertStringNotContainsString('.lowercase', file_get_contents($output));
        } finally {
            proc_terminate($process, SIGTERM);
            proc_close($process);
        }
    }

    private function waitForContents(string $path, string $expected, int $occurrences = 1): void
    {
        $deadline = microtime(true) + 5;
        do {
            clearstatcache(true, $path);
            if (is_file($path) && substr_count(file_get_contents($path), $expected) >= $occurrences) {
                return;
            }
            usleep(20000);
        } while (microtime(true) < $deadline);
        self::fail('The watch process did not generate ' . $expected . '.');
    }

    /**
     * @param list<string> $arguments
     * @return array{exit: int, stdout: string, stderr: string}
     */
    private function runCli(array $arguments, string $stdin = ''): array
    {
        $process = proc_open(
            [PHP_BINARY, dirname(__DIR__) . '/bin/tailwindphp', ...$arguments],
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
            $this->workspace,
        );
        if (!is_resource($process)) {
            throw new \RuntimeException('Could not start the CLI.');
        }
        fwrite($pipes[0], $stdin);
        fclose($pipes[0]);
        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);

        return ['exit' => proc_close($process), 'stdout' => $stdout, 'stderr' => $stderr];
    }
}
