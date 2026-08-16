<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\TestCase;
use TailwindPHP\Tailwind;

/**
 * Tests for the `container` layout component utility.
 *
 * Ported from packages/tailwindcss/src/utilities.test.ts, describe('container').
 * The upstream extraction scripts miss this block because the Tailwind v4.3.2
 * tests use the newer run([classes], css`...`) helper, which the runtime test
 * parsers do not match, so the container cases were silently skipped.
 */
class ContainerUtilityTest extends TestCase
{
    /**
     * Mirrors the "creates the right media queries and sorts it before width"
     * inline snapshot: `width: 100%` followed by an ascending @media rule per
     * theme breakpoint, each capping max-width at that breakpoint.
     */
    public function test_container_emits_width_and_per_breakpoint_media_queries(): void
    {
        $css = Tailwind::generate([
            'content' => '<div class="container"></div>',
            'css' => <<<'CSS'
                @theme {
                    --breakpoint-sm: 40rem;
                    --breakpoint-md: 48rem;
                    --breakpoint-lg: 64rem;
                    --breakpoint-xl: 80rem;
                    --breakpoint-2xl: 96rem;
                }
                @tailwind utilities;
                CSS,
            'minify' => false,
        ]);

        $expected = <<<'CSS'
            .container {
              width: 100%;
            }
            @media (min-width: 40rem) {
              .container {
                max-width: 40rem;
              }
            }
            @media (min-width: 48rem) {
              .container {
                max-width: 48rem;
              }
            }
            @media (min-width: 64rem) {
              .container {
                max-width: 64rem;
              }
            }
            @media (min-width: 80rem) {
              .container {
                max-width: 80rem;
              }
            }
            @media (min-width: 96rem) {
              .container {
                max-width: 96rem;
              }
            }
            CSS;

        $this->assertStringContainsString($expected, $css);
    }

    /**
     * Mirrors the "sorts breakpoints based on unit and then in ascending order"
     * inline snapshot: mixed units (em, px, rem) are grouped by unit and sorted
     * ascending, so max-width rules follow em then px then rem.
     */
    public function test_container_sorts_breakpoints_by_unit_then_value(): void
    {
        $css = Tailwind::generate([
            'content' => '<div class="container"></div>',
            'css' => <<<'CSS'
                @theme reference {
                    --breakpoint-lg: 64rem;
                    --breakpoint-xl: 80rem;
                    --breakpoint-3xl: 1600px;
                    --breakpoint-sm: 40em;
                    --breakpoint-2xl: 96rem;
                    --breakpoint-xs: 30px;
                    --breakpoint-md: 48em;
                }
                @tailwind utilities;
                CSS,
            'minify' => false,
        ]);

        $expected = <<<'CSS'
            .container {
              width: 100%;
            }
            @media (min-width: 40em) {
              .container {
                max-width: 40em;
              }
            }
            @media (min-width: 48em) {
              .container {
                max-width: 48em;
              }
            }
            @media (min-width: 30px) {
              .container {
                max-width: 30px;
              }
            }
            @media (min-width: 1600px) {
              .container {
                max-width: 1600px;
              }
            }
            @media (min-width: 64rem) {
              .container {
                max-width: 64rem;
              }
            }
            @media (min-width: 80rem) {
              .container {
                max-width: 80rem;
              }
            }
            @media (min-width: 96rem) {
              .container {
                max-width: 96rem;
              }
            }
            CSS;

        $this->assertStringContainsString($expected, $css);
    }

    /**
     * A custom `@theme { --breakpoint-* }` value must be honoured and sorted in,
     * proving the breakpoints come from the theme namespace rather than a
     * hardcoded list.
     */
    public function test_container_honours_custom_theme_breakpoint(): void
    {
        $css = Tailwind::generate([
            'content' => '<div class="container"></div>',
            'css' => '@theme { --breakpoint-tab: 30rem; } @tailwind utilities;',
            'minify' => true,
        ]);

        $this->assertStringContainsString('.container{width:100%}', $css);
        $this->assertStringContainsString('@media (min-width:30rem){.container{max-width:30rem}}', $css);
    }
}
