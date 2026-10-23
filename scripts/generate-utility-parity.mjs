#!/usr/bin/env bun
// Regenerate issue #16 regression expectations from the pinned Tailwind source.
// Run with: bun scripts/generate-utility-parity.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { compile } from '../reference/tailwindcss/packages/tailwindcss/src/index.ts';
import { parse } from '../reference/tailwindcss/packages/tailwindcss/src/css-parser.ts';
import { escape } from '../reference/tailwindcss/packages/tailwindcss/src/utils/escape.ts';

const upstream = new URL('../reference/tailwindcss/', import.meta.url);
const theme = readFileSync(new URL('packages/tailwindcss/theme.css', upstream), 'utf8');
const version = JSON.parse(readFileSync(new URL('packages/tailwindcss/package.json', upstream))).version;
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

const cases = [];
for (const input of inputs) {
  const compiler = await compile(`${theme}\n${input.css}\n@tailwind utilities;`);
  const selector = '.' + escape(input.candidate);
  const properties = {};
  // Like the public properties() API, retain the last declaration from each
  // matching rule, including declarations inside its conditional rules.
  function declarations(nodes) {
    for (const node of nodes) {
      if (node.kind === 'declaration') properties[node.property] = node.value;
      else if (node.nodes) declarations(node.nodes);
    }
  }
  function collect(nodes) {
    for (const node of nodes) {
      if (node.kind === 'rule' && node.selector === selector) declarations(node.nodes);
      else if (node.nodes) collect(node.nodes);
    }
  }
  collect(parse(compiler.build([input.candidate])));
  cases.push({ ...input, properties });
}

const fixture = {
  version,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim(),
  cases,
};
writeFileSync(new URL('../tests/fixtures/utility-parity.json', import.meta.url), JSON.stringify(fixture, null, 2) + '\n');
console.log(`Captured ${cases.length} utility cases from Tailwind CSS ${version}.`);
