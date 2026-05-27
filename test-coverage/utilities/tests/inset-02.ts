/**
 * Extracted from tailwindcss/packages/tailwindcss/src/utilities.test.ts
 *
 * These tests show the expected CSS output for each utility class.
 * Use as reference when implementing PHP utilities.
 */

import { expect, test } from 'vitest'
import { compileCss, run } from './test-utils/run'

test('bottom', async () => {
  expect(
    await compileCss(
      css`
        @theme {
          --spacing-4: 1rem;
          --inset-shadowned: 1940px;
        }
        @tailwind utilities;
      `,
      [
        'bottom-shadowned',
        'bottom-auto',
        '-bottom-full',
        'bottom-full',
        'bottom-3/4',
        'bottom-4',
        '-bottom-4',
        'bottom-[4px]',
      ],
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
      --inset-shadowned: 1940px;
    }

    .-bottom-4 {
      bottom: calc(var(--spacing-4) * -1);
    }

    .-bottom-full {
      bottom: -100%;
    }

    .bottom-3\\/4 {
      bottom: 75%;
    }

    .bottom-4 {
      bottom: var(--spacing-4);
    }

    .bottom-\\[4px\\] {
      bottom: 4px;
    }

    .bottom-auto {
      bottom: auto;
    }

    .bottom-full {
      bottom: 100%;
    }

    .bottom-shadowned {
      bottom: var(--inset-shadowned);
    }
    "
  `)
  expect(
    await compileCss(
      css`
        @theme reference {
          --spacing-4: 1rem;
          --inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);
        }
        @tailwind utilities;
      `,
      [
        'bottom-shadow-sm',
        'bottom',
        'bottom--1',
        'bottom--1/2',
        'bottom--1/-2',
        'bottom-1/-2',
        'bottom-auto/foo',
        '-bottom-full/foo',
        'bottom-full/foo',
        'bottom-3/4/foo',
        'bottom-4/foo',
        '-bottom-4/foo',
        'bottom-[4px]/foo',
      ],
    ),
  ).toEqual('')
})

test('left', async () => {
  expect(
    await compileCss(
      css`
        @theme {
          --spacing-4: 1rem;
          --inset-shadowned: 1940px;
        }
        @tailwind utilities;
      `,
      [
        'left-shadowned',
        'left-auto',
        '-left-full',
        'left-full',
        'left-3/4',
        'left-4',
        '-left-4',
        'left-[4px]',

        // https://github.com/tailwindlabs/tailwindcss/issues/20010
        '-left-[(var(--my-var1)+var(--my-var2))]',
      ],
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
      --inset-shadowned: 1940px;
    }

    .-left-4 {
      left: calc(var(--spacing-4) * -1);
    }

    .-left-\\[\\(var\\(--my-var1\\)\\+var\\(--my-var2\\)\\)\\] {
      left: calc((var(--my-var1) + var(--my-var2)) * -1);
    }

    .-left-full {
      left: -100%;
    }

    .left-3\\/4 {
      left: 75%;
    }

    .left-4 {
      left: var(--spacing-4);
    }

    .left-\\[4px\\] {
      left: 4px;
    }

    .left-auto {
      left: auto;
    }

    .left-full {
      left: 100%;
    }

    .left-shadowned {
      left: var(--inset-shadowned);
    }
    "
  `)
  expect(
    await compileCss(
      css`
        @theme reference {
          --spacing-4: 1rem;
          --inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);
        }
        @tailwind utilities;
      `,
      [
        'left-shadow-sm',
        'left',
        'left--1',
        'left--1/2',
        'left--1/-2',
        'left-1/-2',
        'left-auto/foo',
        '-left-full/foo',
        'left-full/foo',
        'left-3/4/foo',
        'left-4/foo',
        '-left-4/foo',
        'left-[4px]/foo',
      ],
    ),
  ).toEqual('')
})

test('inset-shadow', async () => {
  expect(
    await compileCss(
      css`
        @theme {
          --color-red-500: #ef4444;
          --inset-shadow: inset 0 2px 4px rgb(0 0 0 / 0.05);
          --inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);
        }
        @tailwind utilities;
      `,
      [
        // Shadows
        'inset-shadow',
        'inset-shadow-sm',
        'inset-shadow-none',
        'inset-shadow-[12px_12px_#0088cc]',
        'inset-shadow-[12px_12px_var(--value)]',
        'inset-shadow-[10px_10px]',
        'inset-shadow-[var(--value)]',
        'inset-shadow-[shadow:var(--value)]',
        'inset-shadow-[12px_12px_#0088cc,12px_12px_var(--value,#0088cc)]',

        'inset-shadow-sm/25',
        'inset-shadow-[12px_12px_#0088cc]/25',
        'inset-shadow-[12px_12px_var(--value)]/25',
        'inset-shadow-[10px_10px]/25',
        'inset-shadow-[12px_12px_#0088cc,12px_12px_var(--value,#0088cc)]/25',

        // Colors
        'inset-shadow-red-500',
        'inset-shadow-red-500/50',
        'inset-shadow-red-500/2.25',
        'inset-shadow-red-500/2.5',
        'inset-shadow-red-500/2.75',
        'inset-shadow-red-500/[0.5]',
        'inset-shadow-red-500/[50%]',
        'inset-shadow-current',
        'inset-shadow-current/50',
        'inset-shadow-current/[0.5]',
        'inset-shadow-current/[50%]',
        'inset-shadow-inherit',
        'inset-shadow-transparent',
        'inset-shadow-[#0088cc]',
        'inset-shadow-[#0088cc]/50',
        'inset-shadow-[#0088cc]/[0.5]',
        'inset-shadow-[#0088cc]/[50%]',
        'inset-shadow-[color:var(--value)]',
        'inset-shadow-[color:var(--value)]/50',
        'inset-shadow-[color:var(--value)]/[0.5]',
        'inset-shadow-[color:var(--value)]/[50%]',
      ],
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer properties {
      @supports (((-webkit-hyphens: none)) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {
        *, :before, :after, ::backdrop {
          --tw-shadow: 0 0 #0000;
          --tw-shadow-color: initial;
          --tw-shadow-alpha: 100%;
          --tw-inset-shadow: 0 0 #0000;
          --tw-inset-shadow-color: initial;
          --tw-inset-shadow-alpha: 100%;
          --tw-ring-color: initial;
          --tw-ring-shadow: 0 0 #0000;
          --tw-inset-ring-color: initial;
          --tw-inset-ring-shadow: 0 0 #0000;
          --tw-ring-inset: initial;
          --tw-ring-offset-width: 0px;
          --tw-ring-offset-color: #fff;
          --tw-ring-offset-shadow: 0 0 #0000;
        }
      }
    }

    :root, :host {
      --color-red-500: #ef4444;
    }

    .inset-shadow-\\[12px_12px_\\#0088cc\\,12px_12px_var\\(--value\\,\\#0088cc\\)\\]\\/25 {
      --tw-inset-shadow-alpha: 25%;
      --tw-inset-shadow: inset 12px 12px var(--tw-inset-shadow-color, #08c), inset 12px 12px var(--tw-inset-shadow-color, var(--value, #08c));
    }

    @supports (color: lab(from red l a b)) {
      .inset-shadow-\\[12px_12px_\\#0088cc\\,12px_12px_var\\(--value\\,\\#0088cc\\)\\]\\/25 {
        --tw-inset-shadow: inset 12px 12px var(--tw-inset-shadow-color, oklab(59.9824% -.067 -.124 / .25)), inset 12px 12px var(--tw-inset-shadow-color, oklab(from var(--value, #08c) l a b / 25%));
      }
    }

    .inset-shadow-\\[12px_12px_\\#0088cc\\,12px_12px_var\\(--value\\,\\#0088cc\\)\\]\\/25 {
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-\\[12px_12px_var\\(--value\\)\\]\\/25 {
      --tw-inset-shadow-alpha: 25%;
      --tw-inset-shadow: inset 12px 12px var(--tw-inset-shadow-color, var(--value));
    }

    @supports (color: lab(from red l a b)) {
      .inset-shadow-\\[12px_12px_var\\(--value\\)\\]\\/25 {
        --tw-inset-shadow: inset 12px 12px var(--tw-inset-shadow-color, oklab(from var(--value) l a b / 25%));
      }
    }

    .inset-shadow-\\[12px_12px_var\\(--value\\)\\]\\/25 {
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-\\[10px_10px\\]\\/25 {
      --tw-inset-shadow-alpha: 25%;
      --tw-inset-shadow: inset 10px 10px var(--tw-inset-shadow-color, currentcolor);
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-\\[10px_10px\\]\\/25 {
        --tw-inset-shadow: inset 10px 10px var(--tw-inset-shadow-color, color-mix(in oklab, currentcolor 25%, transparent));
      }
    }

    .inset-shadow-\\[10px_10px\\]\\/25 {
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-\\[12px_12px_\\#0088cc\\]\\/25 {
      --tw-inset-shadow-alpha: 25%;
      --tw-inset-shadow: inset 12px 12px var(--tw-inset-shadow-color, oklab(59.9824% -.067 -.124 / .25));
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-sm\\/25 {
      --tw-inset-shadow-alpha: 25%;
      --tw-inset-shadow: inset 0 1px 1px var(--tw-inset-shadow-color, oklab(0% 0 0 / .25));
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow {
      --tw-inset-shadow: inset 0 2px 4px var(--tw-inset-shadow-color, #0000000d);
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-\\[10px_10px\\] {
      --tw-inset-shadow: inset 10px 10px var(--tw-inset-shadow-color, currentcolor);
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-\\[12px_12px_\\#0088cc\\,12px_12px_var\\(--value\\,\\#0088cc\\)\\] {
      --tw-inset-shadow: inset 12px 12px var(--tw-inset-shadow-color, #08c), inset 12px 12px var(--tw-inset-shadow-color, var(--value, #08c));
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-\\[12px_12px_\\#0088cc\\] {
      --tw-inset-shadow: inset 12px 12px var(--tw-inset-shadow-color, #08c);
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-\\[12px_12px_var\\(--value\\)\\] {
      --tw-inset-shadow: inset 12px 12px var(--tw-inset-shadow-color, var(--value));
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-\\[shadow\\:var\\(--value\\)\\], .inset-shadow-\\[var\\(--value\\)\\] {
      --tw-inset-shadow: inset var(--value);
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-none {
      --tw-inset-shadow: 0 0 #0000;
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-sm {
      --tw-inset-shadow: inset 0 1px 1px var(--tw-inset-shadow-color, #0000000d);
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }

    .inset-shadow-\\[\\#0088cc\\] {
      --tw-inset-shadow-color: #08c;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-\\[\\#0088cc\\] {
        --tw-inset-shadow-color: color-mix(in oklab, #08c var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-\\[\\#0088cc\\]\\/50 {
      --tw-inset-shadow-color: #0088cc80;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-\\[\\#0088cc\\]\\/50 {
        --tw-inset-shadow-color: color-mix(in oklab, oklab(59.9824% -.067 -.124 / .5) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-\\[\\#0088cc\\]\\/\\[0\\.5\\] {
      --tw-inset-shadow-color: #0088cc80;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-\\[\\#0088cc\\]\\/\\[0\\.5\\] {
        --tw-inset-shadow-color: color-mix(in oklab, oklab(59.9824% -.067 -.124 / .5) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-\\[\\#0088cc\\]\\/\\[50\\%\\] {
      --tw-inset-shadow-color: #0088cc80;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-\\[\\#0088cc\\]\\/\\[50\\%\\] {
        --tw-inset-shadow-color: color-mix(in oklab, oklab(59.9824% -.067 -.124 / .5) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-\\[color\\:var\\(--value\\)\\] {
      --tw-inset-shadow-color: var(--value);
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-\\[color\\:var\\(--value\\)\\] {
        --tw-inset-shadow-color: color-mix(in oklab, var(--value) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-\\[color\\:var\\(--value\\)\\]\\/50 {
      --tw-inset-shadow-color: var(--value);
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-\\[color\\:var\\(--value\\)\\]\\/50 {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, var(--value) 50%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-\\[color\\:var\\(--value\\)\\]\\/\\[0\\.5\\] {
      --tw-inset-shadow-color: var(--value);
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-\\[color\\:var\\(--value\\)\\]\\/\\[0\\.5\\] {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, var(--value) 50%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-\\[color\\:var\\(--value\\)\\]\\/\\[50\\%\\] {
      --tw-inset-shadow-color: var(--value);
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-\\[color\\:var\\(--value\\)\\]\\/\\[50\\%\\] {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, var(--value) 50%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-current {
      --tw-inset-shadow-color: currentcolor;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-current {
        --tw-inset-shadow-color: color-mix(in oklab, currentcolor var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-current\\/50 {
      --tw-inset-shadow-color: currentcolor;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-current\\/50 {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, currentcolor 50%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-current\\/\\[0\\.5\\] {
      --tw-inset-shadow-color: currentcolor;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-current\\/\\[0\\.5\\] {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, currentcolor 50%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-current\\/\\[50\\%\\] {
      --tw-inset-shadow-color: currentcolor;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-current\\/\\[50\\%\\] {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, currentcolor 50%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-inherit {
      --tw-inset-shadow-color: inherit;
    }

    .inset-shadow-red-500 {
      --tw-inset-shadow-color: #ef4444;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-red-500 {
        --tw-inset-shadow-color: color-mix(in oklab, var(--color-red-500) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-red-500\\/2\\.5 {
      --tw-inset-shadow-color: #ef444406;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-red-500\\/2\\.5 {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, var(--color-red-500) 2.5%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-red-500\\/2\\.25 {
      --tw-inset-shadow-color: #ef444406;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-red-500\\/2\\.25 {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, var(--color-red-500) 2.25%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-red-500\\/2\\.75 {
      --tw-inset-shadow-color: #ef444407;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-red-500\\/2\\.75 {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, var(--color-red-500) 2.75%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-red-500\\/50 {
      --tw-inset-shadow-color: #ef444480;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-red-500\\/50 {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, var(--color-red-500) 50%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-red-500\\/\\[0\\.5\\] {
      --tw-inset-shadow-color: #ef444480;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-red-500\\/\\[0\\.5\\] {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, var(--color-red-500) 50%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-red-500\\/\\[50\\%\\] {
      --tw-inset-shadow-color: #ef444480;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-red-500\\/\\[50\\%\\] {
        --tw-inset-shadow-color: color-mix(in oklab, color-mix(in oklab, var(--color-red-500) 50%, transparent) var(--tw-inset-shadow-alpha), transparent);
      }
    }

    .inset-shadow-transparent {
      --tw-inset-shadow-color: transparent;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .inset-shadow-transparent {
        --tw-inset-shadow-color: color-mix(in oklab, transparent var(--tw-inset-shadow-alpha), transparent);
      }
    }

    @property --tw-shadow {
      syntax: "*";
      inherits: false;
      initial-value: 0 0 #0000;
    }

    @property --tw-shadow-color {
      syntax: "*";
      inherits: false
    }

    @property --tw-shadow-alpha {
      syntax: "<percentage>";
      inherits: false;
      initial-value: 100%;
    }

    @property --tw-inset-shadow {
      syntax: "*";
      inherits: false;
      initial-value: 0 0 #0000;
    }

    @property --tw-inset-shadow-color {
      syntax: "*";
      inherits: false
    }

    @property --tw-inset-shadow-alpha {
      syntax: "<percentage>";
      inherits: false;
      initial-value: 100%;
    }

    @property --tw-ring-color {
      syntax: "*";
      inherits: false
    }

    @property --tw-ring-shadow {
      syntax: "*";
      inherits: false;
      initial-value: 0 0 #0000;
    }

    @property --tw-inset-ring-color {
      syntax: "*";
      inherits: false
    }

    @property --tw-inset-ring-shadow {
      syntax: "*";
      inherits: false;
      initial-value: 0 0 #0000;
    }

    @property --tw-ring-inset {
      syntax: "*";
      inherits: false
    }

    @property --tw-ring-offset-width {
      syntax: "<length>";
      inherits: false;
      initial-value: 0;
    }

    @property --tw-ring-offset-color {
      syntax: "*";
      inherits: false;
      initial-value: #fff;
    }

    @property --tw-ring-offset-shadow {
      syntax: "*";
      inherits: false;
      initial-value: 0 0 #0000;
    }
    "
  `)
  expect(
    await run([
      '-inset-shadow-sm',
      '-inset-shadow-none',
      '-inset-shadow-red-500',
      '-inset-shadow-red-500/50',
      '-inset-shadow-red-500/[0.5]',
      '-inset-shadow-red-500/[50%]',
      '-inset-shadow-current',
      '-inset-shadow-current/50',
      '-inset-shadow-current/[0.5]',
      '-inset-shadow-current/[50%]',
      '-inset-shadow-inherit',
      '-inset-shadow-transparent',
      '-inset-shadow-[#0088cc]',
      '-inset-shadow-[#0088cc]/50',
      '-inset-shadow-[#0088cc]/[0.5]',
      '-inset-shadow-[#0088cc]/[50%]',
      '-inset-shadow-[var(--value)]',
    ]),
  ).toEqual('')
})

