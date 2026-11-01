<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use TailwindPHP\tw;

final class ClassAttributeExtractionTest extends TestCase
{
    public static function templates(): iterable
    {
        yield 'php ternary' => [
            '<div class="sw-card flex <?php echo $wide ? \'lg:col-span-2 lg:grid\' : \'\'; ?>">',
            ['sw-card', 'flex', 'lg:col-span-2', 'lg:grid'],
        ];
        yield 'escaped php ternary' => [
            '<header class="<?php echo esc_attr( $sticky ? \'sticky top-0 z-50\' : \'relative z-50 bg-bg\' ); ?>">',
            ['sticky', 'top-0', 'z-50', 'relative', 'bg-bg'],
        ];
        yield 'php array arguments' => [
            '<div class="<?php echo esc_attr( bs_tw_merge( \'flex w-full gap-16\', $class ) ); ?>">',
            ['flex', 'w-full', 'gap-16'],
        ];
        yield 'php statement terminator' => [
            '<div class="<?php $c = \'lg:p-12\'; echo $c; ?>">',
            ['lg:p-12'],
        ];
        yield 'important modifier' => [
            '<div class="h-60 <?php echo $wide ? \'lg:!h-96\' : \'\'; ?>">',
            ['h-60', 'lg:!h-96'],
        ];
        yield 'quoted arbitrary values stay intact' => [
            '<div class="content-[\'a\'] bg-[url(\'/a.png\')] [&_p]:flex">',
            ["content-['a']", "bg-[url('/a.png')]", '[&_p]:flex'],
        ];
        yield 'quoted arbitrary value inside php' => [
            '<div class="<?php echo $on ? \'content-[\\\'x\\\']\' : \'\'; ?>">',
            ["content-[\\'x\\']"],
        ];
        yield 'template literal' => [
            '<div className={`flex ${open ? \'block\' : \'hidden\'}`}></div><p className="`p-4`">',
            ['p-4'],
        ];
    }

    #[Test]
    #[DataProvider('templates')]
    public function itDropsQuoteAndStatementBoundariesFromClassAttributeTokens(string $content, array $expected): void
    {
        $candidates = array_values(tw::extractCandidates($content));

        foreach ($expected as $candidate) {
            self::assertContains($candidate, $candidates);
        }

        foreach ($candidates as $candidate) {
            self::assertDoesNotMatchRegularExpression('/^[\'"`]|[\'"`]$/', $candidate);
        }
    }

    #[Test]
    public function itCompilesUtilitiesFromPhpConditionalClassAttributes(): void
    {
        $css = tw::generate('<div class="<?php echo $wide ? \'lg:grid-cols-2\' : \'gap-4\'; ?>">');

        self::assertStringContainsString('.lg\:grid-cols-2', $css);
        self::assertStringContainsString('.gap-4', $css);
    }
}
