#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import * as Cli from "effect/cli/Command";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import { Features, transform } from "lightningcss";
import { main, promise } from "./lib/cli.ts";
import { run } from "./lib/command.ts";
import { readReferenceVersion, loadReference } from "./lib/upstream.ts";
interface VariantReference {
  readonly compile: typeof import('tailwindcss').compile;
}

const optimize = (input: string) => {
  const pass = (code: Uint8Array) => transform({
    filename: 'input.css',
    code,
    minify: false,
    drafts: { customMedia: true },
    nonStandard: { deepSelectorCombinator: true },
    include: Features.Nesting | Features.MediaQueries,
    exclude: Features.LogicalProperties | Features.DirSelector | Features.LightDark,
    targets: {
      safari: (16 << 16) | (4 << 8),
      ios_saf: (16 << 16) | (4 << 8),
      firefox: 128 << 16,
      chrome: 111 << 16,
    },
    errorRecovery: true,
  }).code;
  return Buffer.from(pass(pass(Buffer.from(input)))).toString().replaceAll('@media not (', '@media not all and (').replace(/^\/\*![^]*?\*\/\s*/, '').trim();
};

export const generate = Effect.scoped(Effect.gen(function* () {
const fs = yield* FileSystem.FileSystem;
const source = (path: string) => JSON.stringify(fileURLToPath(new URL(`../reference/tailwindcss/packages/tailwindcss/src/${path}`, import.meta.url)));
const { compile } = yield* loadReference<VariantReference>(`export {compile} from ${source('index.ts')};`);
const upstream = new URL('../reference/tailwindcss/', import.meta.url);
const version = yield* readReferenceVersion('reference/tailwindcss/packages/tailwindcss/package.json');
const variants = [
  'has-checked', 'has-hover', 'has-focus-visible', 'has-disabled', 'has-open', 'has-placeholder-shown',
  'has-data-slot', 'has-data-[slot=icon]', 'has-data-[state=open]', "has-data-[slot='icon']", 'has-data-[slot=icon_i]',
  'has-aria-checked', 'has-aria-invalid', 'has-aria-[sort=ascending]', 'has-aria-[expanded]',
  'has-[img]', 'has-[p]', 'has-[button]', 'has-[*]', 'has-[img.foo]', 'has-[img#a]', 'has-[svg:hover]',
  'has-[input:checked]', 'has-[li:nth-child(2)]', 'has-[.foo]', 'has-[.a.b]', 'has-[#a]', 'has-[:focus]',
  'has-[:disabled]', 'has-[:not(img)]', 'has-[:not(.a)]', 'has-[:not(img,svg)]', 'has-[:is(img)]',
  'has-[:is(.a,.b)]', 'has-[.a,.b]', 'has-[img,svg]', 'has-[img_span]', 'has-[&_img]', 'has-[&>img]',
  'has-[>img]', 'has-[+img]', 'has-[~img]', 'has-[>svg]', 'has-[[data-x]]', 'has-[[data-x=y]]',
  "has-[[data-x='y']]", 'has-[[data-x=y_i]]', 'has-[[data-x^=y]]', 'has-[[role=checkbox]]',
  'has-[[data-slot=card-action]]', 'has-[>[data-align=block-end]]', 'has-[[data-x=y]>img]',
  'has-[[data-x=y]_img]', 'has-[img]:has-[svg]',
  'group-has-checked', 'group-has-data-[slot=icon]', 'group-has-data-slot/name', 'group-has-aria-expanded',
  'group-has-[img]', 'group-has-[img]/name', 'group-has-[.foo]', 'group-has-[[data-x=y]]',
  'group-has-data-[orientation=horizontal]/field',
  'peer-has-checked', 'peer-has-data-[x=y]', 'peer-has-[img]', 'peer-has-[img]/name', 'peer-has-[.a]/name',
  'peer-has-[[data-x=y]]',
  'not-has-checked', 'not-has-data-[x]', 'not-has-[img]', 'not-has-[.a]', 'not-has-[button]',
  'not-[img]', 'not-[.a]', 'not-[:hover]', 'not-[*]', 'not-[input:checked]', 'not-[[data-x=y]]', "not-[[data-x='y']]",
  'hover:has-data-[state=open]', 'has-data-[state=open]:hover', 'has-data-[slot=icon]:*', '*:has-data-[x]',
];
const candidates = variants.map(variant => `${variant}:flex`);

const cases: Array<{ candidate: string; css: string }> = [];
for (const candidate of candidates) {
  const compiler = yield* promise(() => compile('@tailwind utilities;'));
  cases.push({ candidate, css: optimize(compiler.build([candidate])) });
}

const fixture = {
  version,
  commit: (yield* run({ command: 'git', args: ['rev-parse', 'HEAD'], cwd: fileURLToPath(upstream) })).stdout.trim(),
  cases,
};
yield* fs.writeFileString(fileURLToPath(new URL('../tests/fixtures/variant-parity.json', import.meta.url)), JSON.stringify(fixture, null, 2) + '\n');
console.log(`Captured ${cases.length} variant cases from Tailwind CSS ${version}.`);

}));
export const command = Cli.make('generate-variant-parity', {}, () => generate);
if (import.meta.main) main(command);
