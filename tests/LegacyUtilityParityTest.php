<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use TailwindPHP\tw;

final class LegacyUtilityParityTest extends TestCase
{
    public static function upstreamCases(): iterable
    {
        $fixture = json_decode(file_get_contents(__DIR__ . '/fixtures/legacy-utility-parity.json'), true, flags: JSON_THROW_ON_ERROR);
        foreach ($fixture['cases'] as $case) {
            yield $case['candidate'] => [$case];
        }
    }

    #[Test]
    #[DataProvider('upstreamCases')]
    public function itMatchesPinnedLegacyUtilityDeclarations(array $case): void
    {
        self::assertSame($case['properties'], tw::properties($case['candidate'], '@import "tailwindcss";' . $case['css']));
    }

}
