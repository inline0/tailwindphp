/**
 * Extracted from tailwindcss/packages/tailwindcss/src/utilities.test.ts
 *
 * These tests show the expected CSS output for each utility class.
 * Use as reference when implementing PHP utilities.
 */

import { expect, test } from 'vitest'
import { compileCss, run } from './test-utils/run'

test('scroll-pl', async () => {
  expect(
    await compileCss(
      css`
        @theme {
          --spacing-4: 1rem;
        }
        @tailwind utilities;
      `,
      ['scroll-pl-4', 'scroll-pl-[4px]', '-scroll-pl-4', '-scroll-pl-[var(--value)]'],
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
    }

    .scroll-pl-4 {
      scroll-padding-left: var(--spacing-4);
    }

    .scroll-pl-\\[4px\\] {
      scroll-padding-left: 4px;
    }
    "
  `)
  expect(
    await run([
      'scroll-pl',
      'scroll-pl-4/foo',
      'scroll-pl-[4px]/foo',
      '-scroll-pl-4/foo',
      '-scroll-pl-[var(--value)]/foo',
    ]),
  ).toEqual('')
})

test('scroll-behavior', async () => {
  expect(await run(['scroll-auto', 'scroll-smooth'])).toMatchInlineSnapshot(`
    "
    .scroll-auto {
      scroll-behavior: auto;
    }

    .scroll-smooth {
      scroll-behavior: smooth;
    }
    "
  `)
  expect(
    await run(['scroll', '-scroll-auto', '-scroll-smooth', 'scroll-auto/foo', 'scroll-smooth/foo']),
  ).toEqual('')
})

test('scrollbar-width', async () => {
  expect(await run(['scrollbar-auto', 'scrollbar-thin', 'scrollbar-none'])).toMatchInlineSnapshot(`
    "
    .scrollbar-auto {
      scrollbar-width: auto;
    }

    .scrollbar-none {
      scrollbar-width: none;
    }

    .scrollbar-thin {
      scrollbar-width: thin;
    }
    "
  `)
  expect(
    await run([
      'scrollbar',
      '-scrollbar-auto',
      '-scrollbar-thin',
      '-scrollbar-none',
      'scrollbar-auto/foo',
      'scrollbar-thin/foo',
      'scrollbar-none/foo',
    ]),
  ).toEqual('')
})

test('scrollbar-gutter', async () => {
  expect(await run(['scrollbar-gutter-auto', 'scrollbar-gutter-stable', 'scrollbar-gutter-both']))
    .toMatchInlineSnapshot(`
    "
    .scrollbar-gutter-auto {
      scrollbar-gutter: auto;
    }

    .scrollbar-gutter-both {
      scrollbar-gutter: stable both-edges;
    }

    .scrollbar-gutter-stable {
      scrollbar-gutter: stable;
    }
    "
  `)
  expect(
    await run([
      'scrollbar-gutter',
      '-scrollbar-gutter-auto',
      '-scrollbar-gutter-stable',
      '-scrollbar-gutter-both',
      'scrollbar-gutter-auto/foo',
      'scrollbar-gutter-stable/foo',
      'scrollbar-gutter-both/foo',
    ]),
  ).toEqual('')
})

test('scrollbar-thumb', async () => {
  expect(
    await compileCss(
      css`
        @theme {
          --color-red-500: #ef4444;
        }
        @tailwind utilities;
      `,
      [
        'scrollbar-thumb-red-500',
        'scrollbar-thumb-red-500/50',
        'scrollbar-thumb-red-500/[0.5]',
        'scrollbar-thumb-current',
        'scrollbar-thumb-inherit',
        'scrollbar-thumb-transparent',
        'scrollbar-thumb-[#0088cc]',
        'scrollbar-thumb-[#0088cc]/50',
      ],
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer properties {
      @supports (((-webkit-hyphens: none)) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {
        *, :before, :after, ::backdrop {
          --tw-scrollbar-thumb: #0000;
          --tw-scrollbar-track: #0000;
        }
      }
    }

    :root, :host {
      --color-red-500: #ef4444;
    }

    .scrollbar-thumb-\\[\\#0088cc\\] {
      --tw-scrollbar-thumb: #08c;
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-thumb-\\[\\#0088cc\\]\\/50 {
      --tw-scrollbar-thumb: oklab(59.9824% -.067 -.124 / .5);
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-thumb-current {
      --tw-scrollbar-thumb: currentcolor;
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-thumb-inherit {
      --tw-scrollbar-thumb: inherit;
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-thumb-red-500 {
      --tw-scrollbar-thumb: var(--color-red-500);
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-thumb-red-500\\/50 {
      --tw-scrollbar-thumb: #ef444480;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .scrollbar-thumb-red-500\\/50 {
        --tw-scrollbar-thumb: color-mix(in oklab, var(--color-red-500) 50%, transparent);
      }
    }

    .scrollbar-thumb-red-500\\/50 {
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-thumb-red-500\\/\\[0\\.5\\] {
      --tw-scrollbar-thumb: #ef444480;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .scrollbar-thumb-red-500\\/\\[0\\.5\\] {
        --tw-scrollbar-thumb: color-mix(in oklab, var(--color-red-500) 50%, transparent);
      }
    }

    .scrollbar-thumb-red-500\\/\\[0\\.5\\] {
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-thumb-transparent {
      --tw-scrollbar-thumb: transparent;
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    @property --tw-scrollbar-thumb {
      syntax: "<color>";
      inherits: false;
      initial-value: #0000;
    }

    @property --tw-scrollbar-track {
      syntax: "<color>";
      inherits: false;
      initial-value: #0000;
    }
    "
  `)
  expect(
    await run([
      'scrollbar-thumb',
      '-scrollbar-thumb-red-500',
      '-scrollbar-thumb-red-500/50',
      'scrollbar-thumb-red-500/foo',
      'scrollbar-thumb-[#0088cc]/foo',
    ]),
  ).toEqual('')
})

test('scrollbar-track', async () => {
  expect(
    await compileCss(
      css`
        @theme {
          --color-red-500: #ef4444;
        }
        @tailwind utilities;
      `,
      [
        'scrollbar-track-red-500',
        'scrollbar-track-red-500/50',
        'scrollbar-track-red-500/[0.5]',
        'scrollbar-track-current',
        'scrollbar-track-inherit',
        'scrollbar-track-transparent',
        'scrollbar-track-[#0088cc]',
        'scrollbar-track-[#0088cc]/50',
      ],
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer properties {
      @supports (((-webkit-hyphens: none)) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {
        *, :before, :after, ::backdrop {
          --tw-scrollbar-thumb: #0000;
          --tw-scrollbar-track: #0000;
        }
      }
    }

    :root, :host {
      --color-red-500: #ef4444;
    }

    .scrollbar-track-\\[\\#0088cc\\] {
      --tw-scrollbar-track: #08c;
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-track-\\[\\#0088cc\\]\\/50 {
      --tw-scrollbar-track: oklab(59.9824% -.067 -.124 / .5);
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-track-current {
      --tw-scrollbar-track: currentcolor;
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-track-inherit {
      --tw-scrollbar-track: inherit;
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-track-red-500 {
      --tw-scrollbar-track: var(--color-red-500);
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-track-red-500\\/50 {
      --tw-scrollbar-track: #ef444480;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .scrollbar-track-red-500\\/50 {
        --tw-scrollbar-track: color-mix(in oklab, var(--color-red-500) 50%, transparent);
      }
    }

    .scrollbar-track-red-500\\/50 {
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-track-red-500\\/\\[0\\.5\\] {
      --tw-scrollbar-track: #ef444480;
    }

    @supports (color: color-mix(in lab, red, red)) {
      .scrollbar-track-red-500\\/\\[0\\.5\\] {
        --tw-scrollbar-track: color-mix(in oklab, var(--color-red-500) 50%, transparent);
      }
    }

    .scrollbar-track-red-500\\/\\[0\\.5\\] {
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    .scrollbar-track-transparent {
      --tw-scrollbar-track: transparent;
      scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);
    }

    @property --tw-scrollbar-thumb {
      syntax: "<color>";
      inherits: false;
      initial-value: #0000;
    }

    @property --tw-scrollbar-track {
      syntax: "<color>";
      inherits: false;
      initial-value: #0000;
    }
    "
  `)
  expect(
    await run([
      'scrollbar-track',
      '-scrollbar-track-red-500',
      '-scrollbar-track-red-500/50',
      'scrollbar-track-red-500/foo',
      'scrollbar-track-[#0088cc]/foo',
    ]),
  ).toEqual('')
})

