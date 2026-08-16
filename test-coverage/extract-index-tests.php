#!/usr/bin/env php
<?php

/**
 * Extract compilation tests from index.test.ts
 *
 * This extracts tests that verify the full CSS compilation.
 * Patterns:
 *   - compileCss(css`...`, [...classes]) - Full compilation with theme
 *   - run([...classes]) - Simple class compilation
 *
 * Usage: php extract-index-tests.php
 */

$baseDir = dirname(__DIR__);
$inputFile = $baseDir . '/reference/tailwindcss/packages/tailwindcss/src/index.test.ts';
$outputDir = $baseDir . '/test-coverage/index/tests';

if (!file_exists($inputFile)) {
    echo "Error: index.test.ts not found at: $inputFile\n";
    exit(1);
}

// Create output directory
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

$content = file_get_contents($inputFile);
$lines = explode("\n", $content);
$totalLines = count($lines);

echo "Processing $totalLines lines from index.test.ts\n";

// Parse test() and it() blocks
$tests = [];
$currentTest = null;
$braceDepth = 0;
$inTest = false;
$testContent = [];

for ($i = 0; $i < $totalLines; $i++) {
    $line = $lines[$i];

    // Check for test start
    if (preg_match("/^\\s*(test|it)\(['\"](.+?)['\"]/", $line, $matches)) {
        $currentTest = [
            'name' => $matches[2],
            'startLine' => $i + 1,
        ];
        $inTest = true;
        $braceDepth = 0;
        $testContent = [$line];

        $braceDepth += substr_count($line, '{') - substr_count($line, '}');
        continue;
    }

    if ($inTest) {
        $testContent[] = $line;
        $braceDepth += substr_count($line, '{') - substr_count($line, '}');

        if ($braceDepth <= 0 && preg_match('/^\s*\}\)/', $line)) {
            $currentTest['endLine'] = $i + 1;
            $currentTest['content'] = implode("\n", $testContent);
            $currentTest['lineCount'] = count($testContent);
            $tests[] = $currentTest;
            $inTest = false;
            $currentTest = null;
            $testContent = [];
        }
    }
}

echo 'Found ' . count($tests) . " tests\n\n";

// Extract test cases
$testCases = [];

foreach ($tests as $test) {
    $body = $test['content'];
    $len = strlen($body);

    // Pattern 1: await run(…)
    //
    // Handles every call shape emitted by the upstream test suite:
    // - `await run([...classes])`
    // - `await run(\n [...classes],\n css`...`,\n )` — Prettier multiline
    //   with an optional css template second argument (the v4.3.3
    //   replacement for compileCss(css, candidates))
    // - `await run([...classes], input)` — css template bound to a variable
    $runOffset = 0;
    while (($runPos = strpos($body, 'await run(', $runOffset)) !== false) {
        $runOffset = $runPos + 10;

        // The candidates array may follow `run(` directly or on the next line
        $cursor = $runPos + strlen('await run(');
        while ($cursor < $len && ctype_space($body[$cursor])) {
            $cursor++;
        }
        if ($cursor >= $len || $body[$cursor] !== '[') {
            continue;
        }

        $bracketContent = extractBracketContent(substr($body, $cursor));
        if ($bracketContent === null) {
            continue;
        }
        $classes = parseClassArray($bracketContent);
        $afterArray = $cursor + strlen($bracketContent) + 2;

        // Skip chained method calls on the array, e.g. the sorting tests use
        // `[...].sort(() => Math.random() - 0.5)` to shuffle the candidates
        $cursor = $afterArray;
        while (true) {
            $probe = $cursor;
            while ($probe < $len && ctype_space($body[$probe])) {
                $probe++;
            }
            if (!preg_match('/\G\.[A-Za-z_$][\w$]*\(/', $body, $chainMatch, 0, $probe)) {
                break;
            }
            $parenDepth = 0;
            $p = $probe + strlen($chainMatch[0]) - 1;
            while ($p < $len) {
                if ($body[$p] === '(') {
                    $parenDepth++;
                } elseif ($body[$p] === ')') {
                    $parenDepth--;
                    if ($parenDepth === 0) {
                        $p++;
                        break;
                    }
                }
                $p++;
            }
            $cursor = $p;
        }
        $afterArray = $cursor;

        // Optional second argument: an inline css`...` template or an
        // identifier bound with `let name = css`...`` earlier in the body
        $cssTemplate = null;
        $cursor = $afterArray;
        while ($cursor < $len && (ctype_space($body[$cursor]) || $body[$cursor] === ',')) {
            $cursor++;
        }
        $callEnd = $afterArray;
        if (substr($body, $cursor, 4) === 'css`') {
            $backtickStart = $cursor + 4;
            $backtickEnd = findClosingBacktick(substr($body, $backtickStart));
            if ($backtickEnd !== null) {
                $cssTemplate = substr($body, $backtickStart, $backtickEnd);
                $callEnd = $backtickStart + $backtickEnd;
            }
        } elseif (preg_match('/\G([A-Za-z_$][\w$]*)\s*[,)]/', $body, $identMatch, 0, $cursor)) {
            $identifier = $identMatch[1];
            if (preg_match(
                '/(?:let|const|var)\s+' . preg_quote($identifier, '/') . '\s*=(?:\s|\/\/[^\n]*)*(?:css)?`/',
                $body,
                $declMatch,
                PREG_OFFSET_CAPTURE,
            )) {
                $backtickStart = $declMatch[0][1] + strlen($declMatch[0][0]);
                $backtickEnd = findClosingBacktick(substr($body, $backtickStart));
                if ($backtickEnd !== null) {
                    $cssTemplate = substr($body, $backtickStart, $backtickEnd);
                    $callEnd = $cursor + strlen($identifier);
                }
            }
        }

        // Find toMatchInlineSnapshot after this call
        $afterMatch = substr($body, $callEnd);
        if (preg_match('/\.toMatchInlineSnapshot\s*\(\s*`/s', $afterMatch, $snapshotMatch, PREG_OFFSET_CAPTURE)) {
            $backtickStart = $snapshotMatch[0][1] + strlen($snapshotMatch[0][0]);
            $remaining = substr($afterMatch, $backtickStart);
            $backtickEnd = findClosingBacktick($remaining);

            if ($backtickEnd !== null) {
                $expectedCss = substr($remaining, 0, $backtickEnd);
                $testCases[] = [
                    'name' => $test['name'],
                    'type' => $cssTemplate !== null ? 'compileCss' : 'run',
                    'classes' => $classes,
                    'css' => $cssTemplate !== null ? trim($cssTemplate) : null,
                    'expected' => trim($expectedCss),
                ];
            }
        }
    }

    // Pattern 2: await compileCss(css`...`) or await compileCss(css`...`, [...classes])
    $compileOffset = 0;
    while (($compilePos = strpos($body, 'await compileCss(', $compileOffset)) !== false) {
        $compileOffset = $compilePos + 17;

        $cssStart = strpos($body, 'css`', $compilePos);
        if ($cssStart === false) {
            continue;
        }
        $cssStart += 4;
        $cssEnd = findClosingBacktick(substr($body, $cssStart));
        if ($cssEnd === null) {
            continue;
        }

        $cssTemplate = substr($body, $cssStart, $cssEnd);
        $afterCss = substr($body, $cssStart + $cssEnd);

        // Optional candidates array (legacy compileCss(css, candidates) shape)
        $classes = [];
        if (preg_match('/\G`\s*,\s*\[/', $afterCss, $arrayStartMatch)) {
            $arrayStart = strlen($arrayStartMatch[0]) - 1;
            $bracketContent = extractBracketContent(substr($afterCss, $arrayStart));
            if ($bracketContent !== null) {
                $classes = parseClassArray($bracketContent);
            }
        }

        // Optional options argument: `{ polyfills: Polyfills.None }`
        $polyfills = null;
        if (preg_match('/\G`\s*,\s*\{\s*polyfills:\s*Polyfills\.None\b/', $afterCss)) {
            $polyfills = 'none';
        }

        // Find toMatchInlineSnapshot
        if (preg_match('/\.toMatchInlineSnapshot\s*\(\s*`/s', $afterCss, $snapshotMatch, PREG_OFFSET_CAPTURE)) {
            $backtickStart = $snapshotMatch[0][1] + strlen($snapshotMatch[0][0]);
            $remaining = substr($afterCss, $backtickStart);
            $backtickEnd = findClosingBacktick($remaining);

            if ($backtickEnd !== null) {
                $expectedCss = substr($remaining, 0, $backtickEnd);
                $case = [
                    'name' => $test['name'],
                    'type' => 'compileCss',
                    'classes' => $classes,
                    'css' => trim($cssTemplate),
                    'expected' => trim($expectedCss),
                ];
                if ($polyfills !== null) {
                    $case['polyfills'] = $polyfills;
                }
                $testCases[] = $case;
            }
        }
    }
}

function parseClassArray(string $str): array
{
    $classes = [];
    preg_match_all('/[\'"]([^\'"]+)[\'"]/', $str, $matches);
    foreach ($matches[1] as $class) {
        $classes[] = $class;
    }

    return $classes;
}

/**
 * Extract content within brackets, handling nested brackets properly.
 */
function extractBracketContent(string $str): ?string
{
    if (strlen($str) === 0 || $str[0] !== '[') {
        return null;
    }

    $depth = 0;
    $len = strlen($str);
    $inString = false;
    $stringChar = '';

    for ($i = 0; $i < $len; $i++) {
        $char = $str[$i];

        // Handle string literals to avoid counting brackets inside strings
        if (!$inString && ($char === "'" || $char === '"')) {
            $inString = true;
            $stringChar = $char;
            continue;
        }

        if ($inString) {
            if ($char === '\\' && $i + 1 < $len) {
                $i++; // Skip escaped char
                continue;
            }
            if ($char === $stringChar) {
                $inString = false;
            }
            continue;
        }

        if ($char === '[') {
            $depth++;
        } elseif ($char === ']') {
            $depth--;
            if ($depth === 0) {
                // Return content between brackets (excluding the brackets themselves)
                return substr($str, 1, $i - 1);
            }
        }
    }

    return null;
}

function findClosingBacktick(string $str): ?int
{
    $pos = 0;
    $len = strlen($str);

    while ($pos < $len) {
        $char = $str[$pos];

        if ($char === '\\' && $pos + 1 < $len) {
            $pos += 2;
            continue;
        }

        if ($char === '`') {
            return $pos;
        }

        $pos++;
    }

    return null;
}

echo 'Extracted ' . count($testCases) . " test cases\n\n";

// Count by type
$runTests = array_filter($testCases, fn ($t) => $t['type'] === 'run');
$compileCssTests = array_filter($testCases, fn ($t) => $t['type'] === 'compileCss');

echo 'run() tests: ' . count($runTests) . "\n";
echo 'compileCss() tests: ' . count($compileCssTests) . "\n\n";

// Categorize tests
$categories = [];
foreach ($testCases as $case) {
    $testName = strtolower($case['name']);

    $category = 'other';
    if (str_contains($testName, '@tailwind')) {
        $category = 'tailwind-directive';
    } elseif (str_contains($testName, '@theme')) {
        $category = 'theme';
    } elseif (str_contains($testName, '@apply')) {
        $category = 'apply';
    } elseif (str_contains($testName, '@import')) {
        $category = 'import';
    } elseif (str_contains($testName, '@layer')) {
        $category = 'layers';
    } elseif (str_contains($testName, 'arbitrary')) {
        $category = 'arbitrary';
    } elseif (str_contains($testName, 'prefix')) {
        $category = 'prefix';
    } elseif (str_contains($testName, 'important')) {
        $category = 'important';
    } elseif (str_contains($testName, 'vendor')) {
        $category = 'vendor-prefixes';
    } elseif (str_contains($testName, 'variable') || str_contains($testName, '--')) {
        $category = 'css-variables';
    }

    if (!isset($categories[$category])) {
        $categories[$category] = [];
    }
    $categories[$category][] = $case;
}

// Write category files
foreach ($categories as $category => $cases) {
    $filename = "$outputDir/$category.json";
    file_put_contents($filename, json_encode($cases, JSON_PRETTY_PRINT));
    echo "Wrote $category.json (" . count($cases) . " cases)\n";
}

// Write summary
$summaryDir = dirname($outputDir);
$outputData = [
    'sourceFile' => 'tailwindcss/packages/tailwindcss/src/index.test.ts',
    'sourceLines' => $totalLines,
    'totalTests' => count($tests),
    'totalCases' => count($testCases),
    'runTests' => count($runTests),
    'compileCssTests' => count($compileCssTests),
    'categories' => array_map(fn ($c) => count($c), $categories),
];

file_put_contents("$summaryDir/summary.json", json_encode($outputData, JSON_PRETTY_PRINT));

// Write README
$readme = "# Index Test Coverage\n\n";
$readme .= "Tests extracted from `tailwindcss/packages/tailwindcss/src/index.test.ts`\n\n";
$readme .= "## Coverage Stats\n\n";
$readme .= "| Metric | Value |\n";
$readme .= "|--------|-------|\n";
$readme .= "| Source File Lines | $totalLines |\n";
$readme .= "| Original Tests | {$outputData['totalTests']} |\n";
$readme .= "| Extracted Cases | {$outputData['totalCases']} |\n";
$readme .= "| run() tests | {$outputData['runTests']} |\n";
$readme .= "| compileCss() tests | {$outputData['compileCssTests']} |\n\n";
$readme .= "## Test Categories\n\n";
$readme .= "| Category | Cases |\n";
$readme .= "|----------|-------|\n";

ksort($categories);
foreach ($categories as $category => $cases) {
    $count = count($cases);
    $readme .= "| $category | $count |\n";
}

$readme .= "\n## Test Patterns\n\n";
$readme .= "- **run()**: Simple class compilation, similar to utilities tests\n";
$readme .= "- **compileCss()**: Full compilation with @theme blocks and configuration\n";

file_put_contents("$summaryDir/README.md", $readme);

echo "\nDone! Check $summaryDir for extracted tests.\n";
