#!/usr/bin/env bun
// Regenerate PHP configuration and differential cases from the pinned upstream.
// Run with: bun scripts/generate-tailwind-merge.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { getDefaultConfig, twMerge, validators } from '../reference/tailwind-merge/packages/tailwind-merge/src/index.ts';

const version = JSON.parse(readFileSync(new URL('../reference/tailwind-merge/packages/tailwind-merge/package.json', import.meta.url))).version;
const config = getDefaultConfig();
const themeKeys = new Set();
const quote = (value) => `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
function php(value, depth = 2) {
  if (typeof value === 'function') {
    if (value.isThemeGetter) {
      if (!value.themeKey) throw new Error('Upstream theme getter has no themeKey');
      themeKeys.add(value.themeKey);
      return `$themeGetters[${quote(value.themeKey)}]`;
    }
    if (!value.name || validators[value.name] !== value) throw new Error(`Unknown validator: ${value.name}`);
    return `[Validators::class, ${quote(value.name)}]`;
  }
  if (typeof value === 'string') return quote(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === undefined || value === null) return 'null';
  const entries = Array.isArray(value)
    ? value.map((item) => php(item, depth + 1))
    : Object.entries(value).map(([key, item]) => `${quote(key)} => ${php(item, depth + 1)}`);
  const inline = `[${entries.join(', ')}]`;
  if (!inline.includes('\n') && inline.length + depth * 4 <= 112) return inline;
  const indent = '    '.repeat(depth + 1);
  return `[\n${indent}${entries.join(`,\n${indent}`)},\n${'    '.repeat(depth)}]`;
}
const data = php(config);
writeFileSync(new URL('../src/_tailwindphp/lib/tailwind-merge/default-config.php', import.meta.url), `<?php

declare(strict_types=1);

/**
 * Generated from tailwind-merge ${version} (MIT), packages/tailwind-merge/src/lib/default-config.ts.
 * Regenerate with: bun scripts/generate-tailwind-merge.mjs
 *
 * @port-deviation:storage PHP arrays and callables preserve the upstream configuration.
 */

namespace TailwindPHP\\Lib\\TailwindMerge;

require_once __DIR__ . '/validators.php';

class DefaultConfig
{
    /** @return array<string, mixed> */
    public static function get(): array
    {
        $themeGetters = [];
        foreach (${php([...themeKeys])} as $key) {
            $themeGetters[$key] = self::createThemeGetter($key);
        }

        return ${data};
    }

    /** @return array{isThemeGetter: true, themeKey: string, __invoke: callable} */
    private static function createThemeGetter(string $key): array
    {
        return [
            'isThemeGetter' => true,
            'themeKey' => $key,
            '__invoke' => static fn (array $theme): array => $theme[$key] ?? [],
        ];
    }
}
`);

const samples = ['', '0', '1', '-1', '1.0', '1.5', '+2', '1/2', '2.5/3.5', '2xl', 'auto', 'none', 'full', 'red-500', 'foo', '50%', '[2px]', '[length:2px]', '[color:color(display-p3_1_0_0)]', '[light-dark(red,blue)]', '[family-name:Inter]', '[weight:650]', '[number:650]', '(--token)', '(length:--token)', '(weight:--token)', '(family-name:--token)', '@container/card', '@container-size/card', '@container-normal/card'];
function classes(definitions, prefix = '') {
  return definitions.flatMap((item) => {
    if (typeof item === 'string') return [prefix + item];
    if (typeof item === 'function') {
      if (item.isThemeGetter) return classes(item(config.theme), prefix);
      return samples.filter((value) => item(value)).map((value) => prefix + value);
    }
    return Object.entries(item).flatMap(([key, values]) => classes(values, `${prefix}${key}-`));
  });
}
const groups = Object.fromEntries(Object.entries(config.classGroups).map(([key, definitions]) => [key, [...new Set(classes(definitions))]]));
const cases = new Map();
function add(input) { cases.set(input, { input, expected: twMerge(input) }); }
for (const values of Object.values(groups)) {
  for (const value of values) {
    for (const anchor of [values[0], values.at(-1)]) {
      add(`${anchor} ${value}`);
      add(`${value} ${anchor}`);
    }
  }
}
for (const [key, conflicts] of Object.entries(config.conflictingClassGroups)) {
  for (const conflict of conflicts) {
    if (!groups[key]?.length || !groups[conflict]?.length) throw new Error(`Missing samples for ${key}/${conflict}`);
    add(`${groups[key][0]} ${groups[conflict][0]}`);
    add(`${groups[conflict][0]} ${groups[key][0]}`);
  }
}
for (const values of Object.values(groups)) {
  if (values.length > 1) {
    add(`hover:${values[0]} hover:${values.at(-1)}`);
    add(`${values[0]}! ${values.at(-1)}!`);
  }
}
const validatorCases = Object.entries(validators).flatMap(([name, validator]) => samples.map((input) => ({ name, input, expected: validator(input) })));
writeFileSync(new URL('../test-coverage/lib/tailwind-merge/oracle.json', import.meta.url), JSON.stringify({ version, groups: Object.keys(groups).length, cases: [...cases.values()], validators: validatorCases }, null, 2) + '\n');
console.log(`Generated tailwind-merge ${version}: ${Object.keys(groups).length} groups, ${cases.size} merging cases, ${validatorCases.length} validator cases.`);

execFileSync('php', ['vendor/bin/pint', 'src/_tailwindphp/lib/tailwind-merge/default-config.php'], { cwd: new URL('..', import.meta.url), stdio: 'inherit' });
