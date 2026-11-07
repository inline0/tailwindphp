<?php

declare(strict_types=1);

namespace TailwindPHP\Minifier;

/**
 * CSS Minifier - Reduces CSS file size while preserving functionality.
 *
 * Optimizations:
 * - Remove comments
 * - Remove unnecessary whitespace
 * - Shorten hex colors (#ffffff → #fff)
 * - Remove units from zero values (0px → 0)
 * - Shorten font-weight keywords (normal → 400, bold → 700)
 * - Remove empty rules
 *
 * Does NOT:
 * - Merge duplicate selectors (makes debugging harder)
 * - Combine shorthand properties (can affect cascade)
 */
class CssMinifier
{
    /**
     * Minify a CSS string.
     *
     * @param string $css The CSS to minify
     * @return string Minified CSS
     */
    public static function minify(string $css): string
    {
        $css = self::removeComments($css);
        $css = self::removeWhitespace($css);
        $css = self::shortenHexColors($css);
        $css = self::removeZeroUnits($css);
        $css = self::shortenFontWeight($css);
        $css = self::removeEmptyRules($css);

        return trim($css);
    }

    /**
     * Remove CSS comments.
     */
    private static function removeComments(string $css): string
    {
        return preg_replace('/\/\*[\s\S]*?\*\//', '', $css);
    }

    /**
     * Remove unnecessary whitespace.
     */
    private static function removeWhitespace(string $css): string
    {
        $css = preg_replace('/\s+/', ' ', $css);

        $out = '';
        $depth = 0;
        $len = strlen($css);

        for ($i = 0; $i < $len; $i++) {
            $ch = $css[$i];

            if ($ch === '(') {
                $depth++;
                $out .= $ch;

                continue;
            }

            if ($ch === ')') {
                $depth = max(0, $depth - 1);
                $out .= $ch;

                continue;
            }

            if ($ch === ' ') {
                $prev = $out !== '' ? substr($out, -1) : '';
                $next = $i + 1 < $len ? $css[$i + 1] : '';

                $stripAfter = '{};:(';
                $stripBefore = '{};:,)';

                if ($depth === 0) {
                    $stripAfter .= ',';
                }

                if (str_contains($stripAfter, $prev) || str_contains($stripBefore, $next)) {
                    continue;
                }

                // Only strip around selector combinators at depth 0
                if ($depth === 0) {
                    $combinators = '>~+';
                    if (str_contains($combinators, $prev) || str_contains($combinators, $next)) {
                        continue;
                    }
                }
            }

            $out .= $ch;
        }

        return str_replace(';}', '}', $out);
    }

    /**
     * Shorten 6-digit hex colors to 3-digit where possible.
     * #ffffff → #fff, #aabbcc → #abc
     */
    private static function shortenHexColors(string $css): string
    {
        return preg_replace_callback(
            '/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3\b/',
            fn ($m) => '#' . strtolower($m[1] . $m[2] . $m[3]),
            $css,
        );
    }

    /**
     * Remove units from zero values.
     * 0px → 0, 0rem → 0, 0em → 0
     *
     * Exceptions: 0s and 0ms (time values need units in animations)
     */
    private static function removeZeroUnits(string $css): string
    {
        $length = strlen($css);
        $out = '';
        $functions = [];
        $custom = false;
        $declarationStart = true;

        for ($i = 0; $i < $length; $i++) {
            $ch = $css[$i];

            if ($ch === '"' || $ch === "'") {
                $end = $i + 1;
                while ($end < $length && $css[$end] !== $ch) {
                    $end += $css[$end] === '\\' ? 2 : 1;
                }
                $out .= substr($css, $i, $end - $i + 1);
                $i = $end;
                continue;
            }

            if ($ch === '{' || $ch === ';' || $ch === '}') {
                $functions = [];
                $custom = false;
                $declarationStart = true;
                $out .= $ch;
                continue;
            }

            if ($declarationStart && !ctype_space($ch)) {
                $custom = $ch === '-' && ($css[$i + 1] ?? '') === '-';
                $declarationStart = false;
            }

            if ($ch === '(') {
                preg_match('/([a-zA-Z-]*)$/', $out, $name);
                $functions[] = strtolower($name[1] ?? '');
                $out .= $ch;
                continue;
            }

            if ($ch === ')') {
                array_pop($functions);
                $out .= $ch;
                continue;
            }

            if (
                $ch === '0'
                && !$custom
                && !array_intersect($functions, self::UNIT_SENSITIVE_FUNCTIONS)
                && !preg_match('/[\w.#-]$/', $out)
                && preg_match('/\G0(px|rem|em|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc)(?![\w%])/A', $css, $match, 0, $i)
            ) {
                $out .= '0';
                $i += strlen($match[0]) - 1;
                continue;
            }

            $out .= $ch;
        }

        return $out;
    }

    private const UNIT_SENSITIVE_FUNCTIONS = [
        'calc',
        'min',
        'max',
        'clamp',
        'var',
        'env',
        '-webkit-calc',
        'round',
        'mod',
        'rem',
        'abs',
        'sign',
        'hypot',
    ];

    /**
     * Shorten font-weight keywords to numeric values.
     * normal → 400, bold → 700
     */
    private static function shortenFontWeight(string $css): string
    {
        $css = preg_replace('/font-weight:normal\b/', 'font-weight:400', $css);
        $css = preg_replace('/font-weight:bold\b/', 'font-weight:700', $css);

        return $css;
    }

    /**
     * Remove empty rules.
     * .foo {} → (removed)
     */
    private static function removeEmptyRules(string $css): string
    {
        // Remove rules with empty declaration blocks
        // Match selector(s) followed by empty braces
        return preg_replace('/[^{}]+\{\s*\}/', '', $css);
    }
}
