#!/usr/bin/env node
// Regenerate legacy utility declaration expectations from the pinned Tailwind source.
// Run with: node scripts/generate-legacy-parity.ts
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
  ...['t','tr','r','br','b','bl','l','tl'].map(direction => `bg-gradient-to-${direction}`),
  'bg-gradient-to-r/oklch', 'bg-gradient-to-x',
  ...['sm','md','lg','xl','2xl','missing','[4px]'].map(value => `max-w-screen-${value}`),
  'overflow-ellipsis', 'decoration-slice', 'decoration-clone',
  ...['flex-grow','flex-shrink'].flatMap(name => [name, `${name}-0`, `${name}-2`, `${name}-[1.5]`, `${name}-[var(--ratio)]`, `${name}-1/2`, `-${name}-1`, `${name}-missing`]),
  ...['start','end'].flatMap(name => ['auto','full','px','0','4','1/2','[4px]','[var(--inset)]','missing','4/foo','[4px]/2'].flatMap(value => [`${name}-${value}`, `-${name}-${value}`])),
];
const inputs = candidates.map(candidate => ({ candidate, css: '' }));
inputs.push(
  {candidate:'max-w-screen-custom',css:'@theme { --breakpoint-custom: 90rem; }'},
  {candidate:'start-custom',css:'@theme { --inset-custom: 7px; }'},
  {candidate:'-end-custom',css:'@theme { --inset-custom: 7px; }'},
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
yield* fs.writeFileString(fileURLToPath(new URL('../tests/fixtures/legacy-utility-parity.json', import.meta.url)), JSON.stringify(fixture, null, 2) + '\n');
console.log(`Captured ${cases.length} utility cases from Tailwind CSS ${version}.`);

}));
export const command = Cli.make('generate-legacy-parity', {}, () => generate);
if (import.meta.main) main(command);
