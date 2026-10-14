---
title: "Performance & Testing"
description: "PHP-specific optimizations that preserve identical output, and the extraction-based test loop that keeps the port in lockstep with TailwindCSS."
path: "advanced/performance"
order: 170
section: "Advanced"
meta_title: "Performance & Testing"
meta_description: "PHP-specific optimizations that preserve identical output, and the extraction-based test loop that keeps the port in lockstep with TailwindCSS."
---

# Performance & Testing

TailwindPHP optimizes for correctness first. Where a PHP-specific change speeds things up without altering output, it is applied and marked `@port-deviation:performance`. Parity with TailwindCSS is not assumed — it is continuously verified against Tailwind's own test suite.

## Performance

The PHP port prioritizes matching TailwindCSS output over raw throughput, and the TypeScript original stays faster regardless — V8's JIT compiles the hot paths to native code in a way PHP cannot match. For CSS generated per request or per page, reuse one compiler (see [generateExact()](/docs/api#accumulating-vs-exact-generation)) and persist its construction state with [`stateCacheFile`](/docs/advanced/caching#compiler-state-cache).

A few hot paths carry hand-tuned optimizations that **preserve identical output**:

- **`ast.php` `toCss()`** — accumulates fragments in an array and `implode`s once instead of repeated string concatenation, and uses pre-computed indent strings.
- **`css-parser.php`** — compares characters directly instead of going through `ord()`, and tracks buffer lengths instead of recomputing `strlen()`.

Both are documented with `@port-deviation:performance` and gated on the test suite — they cannot change the generated CSS.

### Benchmarks

The `benchmarks/` directory contains a comparison harness. Run it with:

```bash
composer bench         # PHP vs TypeScript
composer bench:save    # write benchmarks/results.json
```

Sample results on PHP 8.4.5 / Node.js v22.17.0 (Apple M1):

| Benchmark | PHP | TypeScript |
|-----------|-----|------------|
| `css-parser` on preflight.css | ~816 ops/s | ~15.45K ops/s (≈20× faster) |
| `toCss` | ~65.85K ops/s | ~2.59M ops/s (≈39× faster) |

TypeScript is faster for these low-level operations, as expected. For full-page CSS generation — the actual use case — PHP performance is adequate (roughly 14 ms per page in the sample run). For repeated identical input, the [file cache](/docs/advanced/caching) removes the cost entirely.

## Testing & parity

Tests exist to guarantee the PHP port produces the same output as TailwindCSS. Two approaches work together.

**1. Extraction-based tests.** Scripts in `test-coverage/` parse TailwindCSS's own `.test.ts` files and extract the test cases to JSON. PHPUnit then feeds those cases through TailwindPHP and compares the output against the expected CSS. Because the expectations come straight from upstream, any divergence in PHP behavior surfaces as a failure. These cover the complex surfaces: utilities, variants, integration, CSS functions, and the browser-level `ui.spec` tests.

**2. Hand-ported unit tests.** Simpler TypeScript test files (AST, CSS parsing, escaping, candidate parsing, value parsing, …) are ported directly to PHP and live beside their source as `*.test.php`, mirroring the structure and assertions of the originals.

The loop is **extract → run → verify**: re-extract from the current TailwindCSS reference, run the suite, and any drift fails. This keeps the port in lockstep with upstream and means a TailwindCSS update can be validated mechanically rather than by inspection. Drift fails CI.

```bash
composer extract   # re-extract test cases from the TailwindCSS reference
composer test      # run the full suite
```

There are **4,427 passing tests** as of release 1.7.0 (TailwindCSS v4.3.3 reference):

| Suite | Tests | Source |
|-------|-------|--------|
| Extracted TailwindCSS suites (utilities 706, variants 164, index 148, css-functions 64, `ui.spec` 68) | 1,150 | extracted from `.test.ts` / `.spec.ts` |
| API coverage (utilities, modifiers, variants, directives, plugins, imports, `@source`, caching, public API) | 2,252 | `tests/` |
| Unit tests beside the source (parser, AST, candidates, theme, utils, selector parser, lightningcss transforms, minifier) | 767 | `*.test.php` ports and PHP-specific tests |
| CLI (argument parsing, output, builds) | 84 | `tests/Cli*Test.php` |
| Plugin ports (typography, forms) | 45 | `*.test.php` beside the plugins |
| Companion libraries (clsx, tailwind-merge, CVA) | 129 | reference suites |

## Code quality

Formatting and static analysis run through Composer scripts:

```bash
composer lint      # Pint --test  (check formatting)
composer format    # Pint         (fix formatting)
composer analyse   # PHPStan      (static analysis, level 4)
composer quality   # lint + analyse
```

PHPStan runs at level 4 (`phpstan.neon`), with a short list of ignored patterns for the dynamic array shapes the function-based architecture uses. All source files are analyzed; test files are excluded.

For the structure these tests verify and where deviations are recorded, see [Architecture](/docs/advanced/architecture).
