#!/usr/bin/env node
// Regenerate PHP configuration and differential cases from the pinned upstream.
// Run with: node scripts/generate-tailwind-merge.ts
import { fileURLToPath } from "node:url";
import * as Cli from "effect/cli/Command";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import { main } from "./lib/cli.ts";
import { run } from "./lib/command.ts";
import { readReferenceVersion, loadReference } from "./lib/upstream.ts";
type MergeReference = typeof import('tailwind-merge');

export const generate = Effect.scoped(Effect.gen(function* () {
const fs = yield* FileSystem.FileSystem;
const version = yield* readReferenceVersion("reference/tailwind-merge/packages/tailwind-merge/package.json");
const entry = fileURLToPath(new URL('../reference/tailwind-merge/packages/tailwind-merge/src/index.ts', import.meta.url));
const { getDefaultConfig, twMerge, validators } = yield* loadReference<MergeReference>(`export * from ${JSON.stringify(entry)};`);
const config = getDefaultConfig();
const themeKeys = new Set<string>();
const quote = (value: unknown) => `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
function php(value: unknown, depth = 2): string {
  if (typeof value === 'function') {
    const theme = value as ((theme: unknown) => unknown) & { isThemeGetter?: boolean; themeKey?: string }; 
    if (theme.isThemeGetter) {
      if (!theme.themeKey) throw new Error('Upstream theme getter has no themeKey');
      themeKeys.add(theme.themeKey);
      return `$themeGetters[${quote(theme.themeKey)}]`;
    }
    if (!value.name || validators[value.name as keyof typeof validators] !== value) throw new Error(`Unknown validator: ${value.name}`);
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
yield* fs.writeFileString(fileURLToPath(new URL('../src/_tailwindphp/lib/tailwind-merge/default-config.php', import.meta.url)), `<?php

declare(strict_types=1);

/**
 * Generated from tailwind-merge ${version} (MIT), packages/tailwind-merge/src/lib/default-config.ts.
 * Regenerate with: node scripts/generate-tailwind-merge.ts
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
function classes(definitions: readonly unknown[], prefix = ''): string[] {
  return definitions.flatMap((item) => {
    if (typeof item === 'string') return [prefix + item];
    if (typeof item === 'function') {
      const getter = item as ((theme: typeof config.theme) => readonly unknown[]) & { isThemeGetter?: boolean };
      if (getter.isThemeGetter) return classes(getter(config.theme), prefix);
      return samples.filter((value) => item(value)).map((value) => prefix + value);
    }
    return Object.entries(item as Record<string, readonly unknown[]>).flatMap(([key, values]) => classes(values, `${prefix}${key}-`));
  });
}
const groups = Object.fromEntries(Object.entries(config.classGroups).map(([key, definitions]) => [key, [...new Set(classes(definitions))]]));
const cases = new Map<string, { input: string; expected: string }>();
function add(input: string) { cases.set(input, { input, expected: twMerge(input) }); }
for (const values of Object.values(groups)) {
  for (const value of values) {
    for (const anchor of [values[0], values.at(-1)]) {
      add(`${anchor} ${value}`);
      add(`${value} ${anchor}`);
    }
  }
}
for (const [key, conflicts] of Object.entries(config.conflictingClassGroups)) {
  for (const conflict of conflicts ?? []) {
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
yield* fs.writeFileString(fileURLToPath(new URL('../test-coverage/lib/tailwind-merge/oracle.json', import.meta.url)), JSON.stringify({ version, groups: Object.keys(groups).length, cases: [...cases.values()], validators: validatorCases }, null, 2) + '\n');
console.log(`Generated tailwind-merge ${version}: ${Object.keys(groups).length} groups, ${cases.size} merging cases, ${validatorCases.length} validator cases.`);

yield* run({ command: process.env.PHP_BINARY || 'php', args: ['vendor/bin/pint', 'src/_tailwindphp/lib/tailwind-merge/default-config.php'], cwd: fileURLToPath(new URL('..', import.meta.url)), inherit: true });
}));
export const command = Cli.make('generate-tailwind-merge', {}, () => generate);
if (import.meta.main) main(command);
