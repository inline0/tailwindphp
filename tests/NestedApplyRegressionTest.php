<?php

declare(strict_types=1);

namespace TailwindPHP\Tests;

use PHPUnit\Framework\TestCase;
use TailwindPHP\Tailwind;

/**
 * Regression tests for nested @apply substitution.
 *
 * When a rule's @apply expanded to more than one declaration and that same
 * rule also contained nested child rules using @apply, every nested child was
 * silently dropped from the output. The cause was that substitution tracked
 * AST nodes by integer index path: expanding a multi-declaration @apply shifted
 * the following siblings' indices and invalidated the nested rules' tracked
 * paths, so their own @apply was never substituted and the child rule was
 * discarded. A single-declaration @apply in the parent did not trigger it.
 *
 * The fix substitutes each sorted parent with a single recursive walk (matching
 * apply.ts) and propagates nested @apply dependencies to ancestor rules.
 */
class NestedApplyRegressionTest extends TestCase
{
    /**
     * A multi-declaration parent @apply must not swallow its nested child rule.
     * `mt-0 mb-0` expands to two declarations; before the fix, `.child` and its
     * `@apply block` were dropped entirely.
     */
    public function test_nested_apply_survives_multi_declaration_parent(): void
    {
        $css = Tailwind::generate([
            'content' => '<div></div>',
            'css' => '@import "tailwindcss"; #bug { @apply mt-0 mb-0; .child { @apply block; } }',
            'minify' => true,
        ]);

        $this->assertStringContainsString('#bug .child{display:block}', $css);
    }

    /**
     * A single-declaration parent @apply always worked; keep it green so the
     * fix can never trade one regression for another.
     */
    public function test_nested_apply_survives_single_declaration_parent(): void
    {
        $css = Tailwind::generate([
            'content' => '<div></div>',
            'css' => '@import "tailwindcss"; #ok { @apply pl-0; .kid { @apply block; } }',
            'minify' => true,
        ]);

        $this->assertStringContainsString('#ok .kid{display:block}', $css);
    }

    /**
     * The parent's own multi-declaration @apply must still expand alongside the
     * surviving nested child.
     */
    public function test_multi_declaration_parent_and_nested_child_both_emitted(): void
    {
        $css = Tailwind::generate([
            'content' => '<div></div>',
            'css' => '@import "tailwindcss"; #bug { @apply mt-0 mb-0; .child { @apply block; } }',
            'minify' => true,
        ]);

        $this->assertStringContainsString('margin-top:calc(var(--spacing) * 0)', $css);
        $this->assertStringContainsString('margin-bottom:calc(var(--spacing) * 0)', $css);
        $this->assertStringContainsString('#bug .child{display:block}', $css);
    }
}
