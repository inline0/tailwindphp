/**
 * Extracted from tailwindcss/packages/tailwindcss/src/utilities.test.ts
 *
 * These tests show the expected CSS output for each utility class.
 * Use as reference when implementing PHP utilities.
 */

import { expect, test } from 'vitest'
import { compileCss, run } from './test-utils/run'

test('space-x', async () => {
  expect(
    await run(
      [
        'space-x-0',
        'space-x-[0]',
        'space-x-[0px]',
        '-space-x-0',
        'space-x-[-0]',
        'space-x-[-0px]',
        'space-x-1',
        '-space-x-1',
        'space-x-4',
        'space-x-[4px]',
        '-space-x-4',
      ],
      css`
        @theme {
          --spacing: 0.25rem;
          --spacing-4: 1rem;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer properties {
      @supports (((-webkit-hyphens: none)) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {
        *, :before, :after, ::backdrop {
          --tw-space-x-reverse: 0;
        }
      }
    }

    :root, :host {
      --spacing: .25rem;
      --spacing-4: 1rem;
    }

    :where(.-space-x-0 > :not(:last-child)) {
      --tw-space-x-reverse: 0;
      margin-inline: 0;
    }

    :where(.-space-x-1 > :not(:last-child)) {
      --tw-space-x-reverse: 0;
      margin-inline-start: calc(calc(var(--spacing) * -1) * var(--tw-space-x-reverse));
      margin-inline-end: calc(calc(var(--spacing) * -1) * calc(1 - var(--tw-space-x-reverse)));
    }

    :where(.-space-x-4 > :not(:last-child)) {
      --tw-space-x-reverse: 0;
      margin-inline-start: calc(calc(var(--spacing-4) * -1) * var(--tw-space-x-reverse));
      margin-inline-end: calc(calc(var(--spacing-4) * -1) * calc(1 - var(--tw-space-x-reverse)));
    }

    :where(.space-x-0 > :not(:last-child)) {
      --tw-space-x-reverse: 0;
      margin-inline: 0;
    }

    :where(.space-x-1 > :not(:last-child)) {
      --tw-space-x-reverse: 0;
      margin-inline-start: calc(var(--spacing) * var(--tw-space-x-reverse));
      margin-inline-end: calc(var(--spacing) * calc(1 - var(--tw-space-x-reverse)));
    }

    :where(.space-x-4 > :not(:last-child)) {
      --tw-space-x-reverse: 0;
      margin-inline-start: calc(var(--spacing-4) * var(--tw-space-x-reverse));
      margin-inline-end: calc(var(--spacing-4) * calc(1 - var(--tw-space-x-reverse)));
    }

    :where(.space-x-\\[-0\\] > :not(:last-child)), :where(.space-x-\\[-0px\\] > :not(:last-child)), :where(.space-x-\\[0\\] > :not(:last-child)), :where(.space-x-\\[0px\\] > :not(:last-child)) {
      --tw-space-x-reverse: 0;
      margin-inline: 0;
    }

    :where(.space-x-\\[4px\\] > :not(:last-child)) {
      --tw-space-x-reverse: 0;
      margin-inline-start: calc(4px * var(--tw-space-x-reverse));
      margin-inline-end: calc(4px * calc(1 - var(--tw-space-x-reverse)));
    }

    @property --tw-space-x-reverse {
      syntax: "*";
      inherits: false;
      initial-value: 0;
    }
    "
  `)
  expect(await run(['space-x', 'space-x-4/foo', 'space-x-[4px]/foo', '-space-x-4/foo'])).toEqual('')
})

test('space-y', async () => {
  expect(
    await run(
      [
        'space-y-0',
        'space-y-[0]',
        'space-y-[0px]',
        '-space-y-0',
        'space-y-[-0]',
        'space-y-[-0px]',
        'space-y-1',
        '-space-y-1',
        'space-y-4',
        'space-y-[4px]',
        '-space-y-4',
      ],
      css`
        @theme {
          --spacing: 0.25rem;
          --spacing-4: 1rem;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer properties {
      @supports (((-webkit-hyphens: none)) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {
        *, :before, :after, ::backdrop {
          --tw-space-y-reverse: 0;
        }
      }
    }

    :root, :host {
      --spacing: .25rem;
      --spacing-4: 1rem;
    }

    :where(.-space-y-0 > :not(:last-child)) {
      --tw-space-y-reverse: 0;
      margin-block: 0;
    }

    :where(.-space-y-1 > :not(:last-child)) {
      --tw-space-y-reverse: 0;
      margin-block-start: calc(calc(var(--spacing) * -1) * var(--tw-space-y-reverse));
      margin-block-end: calc(calc(var(--spacing) * -1) * calc(1 - var(--tw-space-y-reverse)));
    }

    :where(.-space-y-4 > :not(:last-child)) {
      --tw-space-y-reverse: 0;
      margin-block-start: calc(calc(var(--spacing-4) * -1) * var(--tw-space-y-reverse));
      margin-block-end: calc(calc(var(--spacing-4) * -1) * calc(1 - var(--tw-space-y-reverse)));
    }

    :where(.space-y-0 > :not(:last-child)) {
      --tw-space-y-reverse: 0;
      margin-block: 0;
    }

    :where(.space-y-1 > :not(:last-child)) {
      --tw-space-y-reverse: 0;
      margin-block-start: calc(var(--spacing) * var(--tw-space-y-reverse));
      margin-block-end: calc(var(--spacing) * calc(1 - var(--tw-space-y-reverse)));
    }

    :where(.space-y-4 > :not(:last-child)) {
      --tw-space-y-reverse: 0;
      margin-block-start: calc(var(--spacing-4) * var(--tw-space-y-reverse));
      margin-block-end: calc(var(--spacing-4) * calc(1 - var(--tw-space-y-reverse)));
    }

    :where(.space-y-\\[-0\\] > :not(:last-child)), :where(.space-y-\\[-0px\\] > :not(:last-child)), :where(.space-y-\\[0\\] > :not(:last-child)), :where(.space-y-\\[0px\\] > :not(:last-child)) {
      --tw-space-y-reverse: 0;
      margin-block: 0;
    }

    :where(.space-y-\\[4px\\] > :not(:last-child)) {
      --tw-space-y-reverse: 0;
      margin-block-start: calc(4px * var(--tw-space-y-reverse));
      margin-block-end: calc(4px * calc(1 - var(--tw-space-y-reverse)));
    }

    @property --tw-space-y-reverse {
      syntax: "*";
      inherits: false;
      initial-value: 0;
    }
    "
  `)
  expect(await run(['space-y', 'space-y-4/foo', 'space-y-[4px]/foo', '-space-y-4/foo'])).toEqual('')
})

test('space-x-reverse', async () => {
  expect(await run(['space-x-reverse'])).toMatchInlineSnapshot(`
    "
    @layer properties {
      @supports (((-webkit-hyphens: none)) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {
        *, :before, :after, ::backdrop {
          --tw-space-x-reverse: 0;
        }
      }
    }

    :where(.space-x-reverse > :not(:last-child)) {
      --tw-space-x-reverse: 1;
    }

    @property --tw-space-x-reverse {
      syntax: "*";
      inherits: false;
      initial-value: 0;
    }
    "
  `)
  expect(await run(['-space-x-reverse', 'space-x-reverse/foo'])).toEqual('')
})

test('space-y-reverse', async () => {
  expect(await run(['space-y-reverse'])).toMatchInlineSnapshot(`
    "
    @layer properties {
      @supports (((-webkit-hyphens: none)) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {
        *, :before, :after, ::backdrop {
          --tw-space-y-reverse: 0;
        }
      }
    }

    :where(.space-y-reverse > :not(:last-child)) {
      --tw-space-y-reverse: 1;
    }

    @property --tw-space-y-reverse {
      syntax: "*";
      inherits: false;
      initial-value: 0;
    }
    "
  `)
  expect(await run(['-space-y-reverse', 'space-y-reverse/foo'])).toEqual('')
})

