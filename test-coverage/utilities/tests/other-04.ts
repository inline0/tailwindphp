/**
 * Extracted from tailwindcss/packages/tailwindcss/src/utilities.test.ts
 *
 * These tests show the expected CSS output for each utility class.
 * Use as reference when implementing PHP utilities.
 */

import { expect, test } from 'vitest'
import { compileCss, run } from './test-utils/run'

test('resolve value based on `@theme inline`', async () => {
  let input = css`
    @theme inline {
      --example-a: 8;
    }

    @utility example-* {
      --resolved-value: --value(--example);
    }

    @tailwind utilities;
  `

  expect(await run(['example-a'], input)).toMatchInlineSnapshot(`
    "
    .example-a {
      --resolved-value: 8;
    }
    "
  `)
})

test('resolve value based on `@theme inline reference`', async () => {
  let input = css`
    @theme inline reference {
      --example-a: 8;
    }

    @utility example-* {
      --resolved-value: --value(--example);
    }

    @tailwind utilities;
  `

  expect(await run(['example-a'], input)).toMatchInlineSnapshot(`
    "
    .example-a {
      --resolved-value: 8;
    }
    "
  `)
})

test('sub namespaces can live in different @theme blocks (1)', async () => {
  let input = `
    @theme reference {
      --text-xs: 0.75rem;
    }

    @theme inline reference {
      --text-xs--line-height: calc(1 / 0.75);
    }

    @utility example-* {
      font-size: --value(--text);
      line-height: --value(--text-*--line-height);
    }

    @tailwind utilities;
  `

  expect(await run(['example-xs'], input)).toMatchInlineSnapshot(`
    "
    .example-xs {
      font-size: var(--text-xs, .75rem);
      line-height: 1.33333;
    }
    "
  `)
})

test('sub namespaces can live in different @theme blocks (2)', async () => {
  let input = `
    @theme inline reference {
      --text-xs: 0.75rem;
    }

    @theme reference {
      --text-xs--line-height: calc(1 / 0.75);
    }

    @utility example-* {
      font-size: --value(--text);
      line-height: --value(--text-*--line-height);
    }

    @tailwind utilities;
  `

  expect(await run(['example-xs'], input)).toMatchInlineSnapshot(`
    "
    .example-xs {
      font-size: .75rem;
      line-height: var(--text-xs--line-height, calc(1 / .75));
    }
    "
  `)
})

test('multiple @utility definitions with the same name but different value types', async () => {
  let input = css`
    @theme {
      --color-red-500: #ef4444;
      --spacing: 0.25rem;
    }

    @utility foo-* {
      color: --value(--color-*);
    }

    @utility foo-* {
      font-size: --spacing(--value(number));
    }

    @tailwind utilities;
  `

  expect(await run(['foo-red-500', 'foo-123'], input)).toMatchInlineSnapshot(`
    "
    :root, :host {
      --color-red-500: #ef4444;
      --spacing: .25rem;
    }

    .foo-123 {
      font-size: calc(var(--spacing) * 123);
    }

    .foo-red-500 {
      color: var(--color-red-500);
    }
    "
  `)
})

