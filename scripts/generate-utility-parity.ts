#!/usr/bin/env node
// Regenerate issue #16 regression expectations from the pinned Tailwind source.
// Run with: node scripts/generate-utility-parity.ts
import { fileURLToPath } from "node:url";
import * as Cli from "effect/cli/Command";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import { main, promise } from "./lib/cli.ts";
import { run } from "./lib/command.ts";
import { readReferenceVersion, loadReference } from "./lib/upstream.ts";
interface ReferenceNode { readonly kind: string; readonly property: string; readonly value: string; readonly selector: string; readonly nodes?: readonly ReferenceNode[] }
interface UtilityReference {
  readonly compile: typeof import('tailwindcss').compile;
  readonly parse: (css: string) => readonly ReferenceNode[];
  readonly escape: (value: string) => string;
}

export const generate = Effect.scoped(Effect.gen(function* () {
const fs = yield* FileSystem.FileSystem;
const source = (path: string) => JSON.stringify(fileURLToPath(new URL(`../reference/tailwindcss/packages/tailwindcss/src/${path}`, import.meta.url)));
const { compile, parse, escape } = yield* loadReference<UtilityReference>(`export {compile} from ${source('index.ts')};export {parse} from ${source('css-parser.ts')};export {escape} from ${source('utils/escape.ts')};`);
const upstream = new URL('../reference/tailwindcss/', import.meta.url);
const theme = yield* fs.readFileString(fileURLToPath(new URL('packages/tailwindcss/theme.css', upstream)));
const version = yield* readReferenceVersion('reference/tailwindcss/packages/tailwindcss/package.json');
const candidates = [
  'rounded', 'rounded-t', 'rounded-md',
  'ring-offset-2', 'ring-offset-[3px]', 'ring-offset-red-500', 'ring-offset-inset',
  'bg-[url(/a.png)]', 'bg-[cover]', 'bg-[120px]', 'bg-[red]', 'bg-[50%]',
  'bg-[length:120px]', 'bg-[position:var(--position)]', 'bg-[image:var(--image)]',
  'bg-[url(/a.png)]/50', 'bg-red-500/50',
  'font-[ui-sans-serif]', 'font-[450]', 'font-[serif]', "font-['Open_Sans']",
  'font-[family-name:var(--font)]', 'font-[var(--weight)]', 'font-[ui-sans-serif]/2',
  'outline-[1.5]', 'stroke-[12px]', 'stroke-[1.5]', 'stroke-[50%]',
  'stroke-[length:var(--stroke)]', 'stroke-[#f00]', 'stroke-[12px]/50', 'stroke-3',
  'inset-shadow-[10px_10px]', 'inset-shadow-[10px_10px,20px_20px]',
  'inset-shadow-[10px_10px_var(--shadow-color)]',
  '-bg-linear-45', '-bg-linear-[45deg]', 'bg-linear-[45deg]',
  'bg-linear-[to_bottom]', '-bg-linear-[to_bottom]', '-bg-linear-to-r',
  '-bg-linear-45/oklch', '-bg-linear-45/[in_hsl_longer_hue]', 'bg-linear-to-r',
  '-col-start-4', '-col-end-2', '-row-start-4', '-row-end-[3]',
  '-col-start-[var(--start)]', '-col-start-auto',
];
const inputs = candidates.map(candidate => ({ candidate, css: '' }));
inputs.push(
  { candidate: 'bg-hero', css: '@theme { --background-image-hero: url(/hero.png); }' },
  { candidate: 'stroke-custom', css: '@theme { --stroke-width-custom: 4px; }' },
  { candidate: '-col-start-custom', css: '@theme { --grid-column-start-custom: 3; }' },
  { candidate: 'ring-offset-custom', css: '@theme { --ring-offset-width-custom: 3px; --ring-offset-color-custom: red; }' },
);

const cases: Array<{ candidate: string; css: string; properties: Record<string, string> }> = [];
for (const input of inputs) {
  const compiler = yield* promise(() => compile(`${theme}\n${input.css}\n@tailwind utilities;`));
  const selector = '.' + escape(input.candidate);
  const properties: Record<string, string> = {};
  function declarations(nodes: readonly ReferenceNode[]) {
    for (const node of nodes) {
      if (node.kind === 'declaration') properties[node.property] = node.value;
      else if (node.nodes) declarations(node.nodes);
    }
  }
  function collect(nodes: readonly ReferenceNode[]) {
    for (const node of nodes) {
      if (node.kind === 'rule' && node.selector === selector) declarations(node.nodes ?? []);
      else if (node.nodes) collect(node.nodes);
    }
  }
  collect(parse(compiler.build([input.candidate])));
  cases.push({ ...input, properties });
}

const fixture = {
  version,
  commit: (yield* run({ command: 'git', args: ['rev-parse', 'HEAD'], cwd: fileURLToPath(upstream) })).stdout.trim(),
  cases,
};
yield* fs.writeFileString(fileURLToPath(new URL('../tests/fixtures/utility-parity.json', import.meta.url)), JSON.stringify(fixture, null, 2) + '\n');
console.log(`Captured ${cases.length} utility cases from Tailwind CSS ${version}.`);

}));
export const command = Cli.make('generate-utility-parity', {}, () => generate);
if (import.meta.main) main(command);
