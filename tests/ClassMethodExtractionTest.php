<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use TailwindPHP\Cli\Application;
use TailwindPHP\Cli\Console\Input;
use TailwindPHP\tw;

final class ClassMethodExtractionTest extends TestCase
{
    public static function methodCalls(): iterable
    {
        yield 'double quoted' => ['Div::in("example")->class("p-4 bg-green-500 text-white")', ['p-4', 'bg-green-500', 'text-white']];
        yield 'single quoted' => ["\$div->class('p-4 flex')", ['p-4', 'flex']];
        yield 'nullsafe with whitespace' => ["\$div?->class (\n 'p-4 flex'\n )", ['p-4', 'flex']];
        yield 'quotes inside arbitrary values' => ['Div::in("example")->class("bg-[url(\'/a.png\')] p-4")', ["bg-[url('/a.png')]", 'p-4']];
        yield 'escaped quotes' => ['Div::in("example")->class("bg-[url(\\"/a.png\\")] p-4")', ['bg-[url("/a.png")]', 'p-4']];
        yield 'mixed attributes' => ['<div class="flex" className="font-bold"> $div->class("p-4 flex")', ['flex', 'font-bold', 'p-4']];
        yield 'dynamic argument' => ['$div->class($classes)', []];
        yield 'concatenated argument' => ['$div->class("p-" . $size)', []];
        yield 'different method' => ['$div->className("p-4")', []];
        yield 'empty argument' => ['$div->class("")', []];
    }

    #[Test]
    #[DataProvider('methodCalls')]
    public function itExtractsOnlyCompleteClassMethodStringArguments(string $content, array $expected): void
    {
        self::assertSame($expected, array_values(tw::extractCandidates($content)));
    }

    #[Test]
    public function itUsesMethodCandidatesInReusableAndStaticCompilers(): void
    {
        $content = '$div->class("flex p-4")';
        $static = tw::generate($content);
        $compiled = tw::compile()->generate($content);
        self::assertSame($static, $compiled);
        self::assertStringContainsString('.flex', $static);
        self::assertStringContainsString('.p-4', $static);
    }

    #[Test]
    public function itScansPhpClassMethodCallsThroughTheCli(): void
    {
        $workspace = sys_get_temp_dir() . '/tailwindphp-method-' . bin2hex(random_bytes(6));
        mkdir($workspace);
        $cwd = getcwd();
        try {
            file_put_contents($workspace . '/template.php', '<?php $div->class("flex p-4");');
            file_put_contents($workspace . '/input.css', '@import "tailwindcss/utilities.css"; @source "./template.php";');
            $app = new Application(new Input([
                'tailwindphp', '--cwd', $workspace, '--input', 'input.css', '--output', 'output.css', '--quiet',
            ]));
            self::assertSame(0, $app->run());
            $css = file_get_contents($workspace . '/output.css');
            self::assertStringContainsString('.flex', $css);
            self::assertStringContainsString('.p-4', $css);
        } finally {
            chdir($cwd);
            foreach (glob($workspace . '/*') as $file) {
                unlink($file);
            }
            rmdir($workspace);
        }
    }
}
