/**
 * Extracted from tailwindcss/packages/tailwindcss/src/utilities.test.ts
 *
 * These tests show the expected CSS output for each utility class.
 * Use as reference when implementing PHP utilities.
 */

import { expect, test } from 'vitest'
import { compileCss, run } from './test-utils/run'

test('gap', async () => {
  expect(
    await run(
      ['gap-4', 'gap-[4px]'],
      css`
        @theme {
          --spacing-4: 1rem;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
    }

    .gap-4 {
      gap: var(--spacing-4);
    }

    .gap-\\[4px\\] {
      gap: 4px;
    }
    "
  `)
  expect(await run(['gap', '-gap-4', '-gap-[4px]', 'gap-4/foo', 'gap-[4px]/foo'])).toEqual('')
})

test('gap-x', async () => {
  expect(
    await run(
      ['gap-x-4', 'gap-x-[4px]'],
      css`
        @theme {
          --spacing-4: 1rem;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
    }

    .gap-x-4 {
      column-gap: var(--spacing-4);
    }

    .gap-x-\\[4px\\] {
      column-gap: 4px;
    }
    "
  `)
  expect(
    await run(['gap-x', '-gap-x-4', '-gap-x-[4px]', 'gap-x-4/foo', 'gap-x-[4px]/foo']),
  ).toEqual('')
})

test('gap-y', async () => {
  expect(
    await run(
      ['gap-y-4', 'gap-y-[4px]'],
      css`
        @theme {
          --spacing-4: 1rem;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
    }

    .gap-y-4 {
      row-gap: var(--spacing-4);
    }

    .gap-y-\\[4px\\] {
      row-gap: 4px;
    }
    "
  `)
  expect(
    await run(['gap-y', '-gap-y-4', '-gap-y-[4px]', 'gap-y-4/foo', 'gap-y-[4px]/foo']),
  ).toEqual('')
})

