<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use TailwindPHP\tw;

final class UtilityParityRegressionTest extends TestCase
{
    public static function upstreamCases(): iterable
    {
        $fixture = json_decode(file_get_contents(__DIR__ . '/fixtures/utility-parity.json'), true, flags: JSON_THROW_ON_ERROR);
        foreach ($fixture['cases'] as $case) {
            yield $case['candidate'] => [$case];
        }
    }

    #[Test]
    #[DataProvider('upstreamCases')]
    public function itMatchesPinnedUpstreamUtilityDeclarations(array $case): void
    {
        self::assertSame($case['properties'], tw::properties($case['candidate'], '@import "tailwindcss";' . $case['css']));
    }

    #[Test]
    public function itSerializesWidthsAndImageValuesLikeLightningCss(): void
    {
        $css = tw::generate('<div class="outline-[1.5] stroke-[1.5] bg-[url(/a.png)]">');
        self::assertStringContainsString('outline-width: 1.5px;', $css);
        self::assertStringContainsString('stroke-width: 1.5px;', $css);
        self::assertStringContainsString('background-image: url("/a.png");', $css);
        self::assertStringNotContainsString('background-color: url(', $css);
    }

    #[Test]
    public function itKeepsGradientFallbacksAndInterpolationConditions(): void
    {
        $css = tw::generate('<div class="-bg-linear-45/oklch -bg-linear-[45deg]">');
        self::assertStringContainsString('--tw-gradient-position: -45deg;', $css);
        self::assertStringContainsString('@supports (background-image: linear-gradient(in lab, red, red))', $css);
        self::assertStringContainsString('--tw-gradient-position: calc(45deg * -1) in oklch;', $css);
        self::assertStringContainsString('linear-gradient(var(--tw-gradient-stops, calc(45deg * -1)))', $css);
    }
}
