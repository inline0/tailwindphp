<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use TailwindPHP\tw;

final class VariantParityTest extends TestCase
{
    public static function upstreamCases(): iterable
    {
        $fixture = json_decode(file_get_contents(__DIR__ . '/fixtures/variant-parity.json'), true, flags: JSON_THROW_ON_ERROR);
        foreach ($fixture['cases'] as $case) {
            yield $case['candidate'] => [$case];
        }
    }

    #[Test]
    #[DataProvider('upstreamCases')]
    public function itMatchesPinnedUpstreamVariantOutput(array $case): void
    {
        $css = tw::compile('@import "tailwindcss/utilities.css";')->css([$case['candidate']]);

        self::assertSame($case['css'], trim($css));
    }

    #[Test]
    public function itScopesHasDataVariantsToDescendants(): void
    {
        $css = tw::generate('<div class="has-data-[slot=icon]:pl-2">');

        self::assertStringContainsString('.has-data-\[slot\=icon\]\:pl-2:has([data-slot="icon"])', $css);
        self::assertStringNotContainsString('.has-data-\[slot\=icon\]\:pl-2[data-slot', $css);
    }
}
