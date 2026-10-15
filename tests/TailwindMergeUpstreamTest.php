<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\TestCase;
use TailwindPHP\Lib\TailwindMerge\DefaultConfig;

use function TailwindPHP\Lib\TailwindMerge\twMerge;

use TailwindPHP\Lib\TailwindMerge\Validators;

final class TailwindMergeUpstreamTest extends TestCase
{
    public function testMatchesPinnedUpstreamClassGroupsAndConflicts(): void
    {
        $oracle = json_decode(file_get_contents(__DIR__ . '/../test-coverage/lib/tailwind-merge/oracle.json'), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame('3.7.0', $oracle['version']);
        self::assertSame($oracle['groups'], count(DefaultConfig::get()['classGroups']));
        foreach ($oracle['cases'] as $case) {
            self::assertSame($case['expected'], twMerge($case['input']), $case['input']);
        }
        foreach ($oracle['validators'] as $case) {
            self::assertSame($case['expected'], Validators::{$case['name']}($case['input']), $case['name'] . ': ' . $case['input']);
        }
    }
}
