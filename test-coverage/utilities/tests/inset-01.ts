/**
 * Extracted from tailwindcss/packages/tailwindcss/src/utilities.test.ts
 *
 * These tests show the expected CSS output for each utility class.
 * Use as reference when implementing PHP utilities.
 */

import { expect, test } from 'vitest'
import { compileCss, run } from './test-utils/run'

test('inset', async () => {
  expect(
    await run(
      [
        'inset-auto',
        'inset-shadow-sm',
        'inset-shadowned',
        '-inset-full',
        'inset-full',
        'inset-3/4',
        'inset-4',
        '-inset-4',
        'inset-[4px]',
      ],
      css`
        @theme {
          --spacing-4: 1rem;
          --inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);
          --inset-shadowned: 1940px;
        }
        @tailwind utilities;
      `,
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
      --spacing-4: 1rem;
      --inset-shadowned: 1940px;
    }

    .-inset-4 {
      inset: calc(var(--spacing-4) * -1);
    }

    .-inset-full {
      inset: -100%;
    }

    .inset-3\\/4 {
      inset: 75%;
    }

    .inset-4 {
      inset: var(--spacing-4);
    }

    .inset-\\[4px\\] {
      inset: 4px;
    }

    .inset-auto {
      inset: auto;
    }

    .inset-full {
      inset: 100%;
    }

    .inset-shadowned {
      inset: var(--inset-shadowned);
    }

    .inset-shadow-sm {
      --tw-inset-shadow: inset 0 1px 1px var(--tw-inset-shadow-color, #0000000d);
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
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
      'inset',
      'inset--1',
      'inset--1/2',
      'inset--1/-2',
      'inset-1/-2',
      'inset-auto/foo',
      '-inset-full/foo',
      'inset-full/foo',
      'inset-3/4/foo',
      'inset-4/foo',
      '-inset-4/foo',
      'inset-[4px]/foo',
    ]),
  ).toEqual('')
})

test('inset-x', async () => {
  expect(
    await run(
      [
        'inset-x-shadowned',
        'inset-x-auto',
        'inset-x-full',
        '-inset-x-full',
        'inset-x-3/4',
        'inset-x-4',
        '-inset-x-4',
        'inset-x-[4px]',
      ],
      css`
        @theme {
          --spacing-4: 1rem;
          --inset-shadowned: 1940px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
      --inset-shadowned: 1940px;
    }

    .-inset-x-4 {
      inset-inline: calc(var(--spacing-4) * -1);
    }

    .-inset-x-full {
      inset-inline: -100%;
    }

    .inset-x-3\\/4 {
      inset-inline: 75%;
    }

    .inset-x-4 {
      inset-inline: var(--spacing-4);
    }

    .inset-x-\\[4px\\] {
      inset-inline: 4px;
    }

    .inset-x-auto {
      inset-inline: auto;
    }

    .inset-x-full {
      inset-inline: 100%;
    }

    .inset-x-shadowned {
      inset-inline: var(--inset-shadowned);
    }
    "
  `)
  expect(
    await run(
      [
        'inset-x-shadow-sm',
        'inset-x',
        'inset-x--1',
        'inset-x--1/2',
        'inset-x--1/-2',
        'inset-x-1/-2',
        'inset-x-auto/foo',
        'inset-x-full/foo',
        '-inset-x-full/foo',
        'inset-x-3/4/foo',
        'inset-x-4/foo',
        '-inset-x-4/foo',
        'inset-x-[4px]/foo',
      ],
      css`
        @theme reference {
          --spacing-4: 1rem;
          --inset-shadow-sm: inset 0 1px 1px #0000000d;
        }
        @tailwind utilities;
      `,
    ),
  ).toEqual('')
})

test('inset-y', async () => {
  expect(
    await run(
      [
        'inset-y-shadowned',
        'inset-y-auto',
        'inset-y-full',
        '-inset-y-full',
        'inset-y-3/4',
        'inset-y-4',
        '-inset-y-4',
        'inset-y-[4px]',
      ],
      css`
        @theme {
          --spacing-4: 1rem;
          --inset-shadowned: 1940px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
      --inset-shadowned: 1940px;
    }

    .-inset-y-4 {
      inset-block: calc(var(--spacing-4) * -1);
    }

    .-inset-y-full {
      inset-block: -100%;
    }

    .inset-y-3\\/4 {
      inset-block: 75%;
    }

    .inset-y-4 {
      inset-block: var(--spacing-4);
    }

    .inset-y-\\[4px\\] {
      inset-block: 4px;
    }

    .inset-y-auto {
      inset-block: auto;
    }

    .inset-y-full {
      inset-block: 100%;
    }

    .inset-y-shadowned {
      inset-block: var(--inset-shadowned);
    }
    "
  `)
  expect(
    await run(
      [
        'inset-y-shadow-sm',
        'inset-y',
        'inset-y--1',
        'inset-y--1/2',
        'inset-y--1/-2',
        'inset-1/-2',
        'inset-y-auto/foo',
        'inset-y-full/foo',
        '-inset-y-full/foo',
        'inset-y-3/4/foo',
        'inset-y-4/foo',
        '-inset-y-4/foo',
        'inset-y-[4px]/foo',
      ],
      css`
        @theme reference {
          --spacing-4: 1rem;
          --inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);
        }
        @tailwind utilities;
      `,
    ),
  ).toEqual('')
})

test('inset-s', async () => {
  expect(
    await run(
      [
        'inset-s-shadowned',
        'inset-s-auto',
        '-inset-s-full',
        'inset-s-full',
        'inset-s-3/4',
        'inset-s-4',
        '-inset-s-4',
        'inset-s-[4px]',
      ],
      css`
        @theme {
          --spacing-4: 1rem;
          --inset-shadowned: 1940px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
      --inset-shadowned: 1940px;
    }

    .-inset-s-4 {
      inset-inline-start: calc(var(--spacing-4) * -1);
    }

    .-inset-s-full {
      inset-inline-start: -100%;
    }

    .inset-s-3\\/4 {
      inset-inline-start: 75%;
    }

    .inset-s-4 {
      inset-inline-start: var(--spacing-4);
    }

    .inset-s-\\[4px\\] {
      inset-inline-start: 4px;
    }

    .inset-s-auto {
      inset-inline-start: auto;
    }

    .inset-s-full {
      inset-inline-start: 100%;
    }

    .inset-s-shadowned {
      inset-inline-start: var(--inset-shadowned);
    }
    "
  `)
  expect(
    await run(
      [
        'inset-s-shadow-sm',
        'inset-s',
        'inset-s--1',
        'inset-s--1/2',
        'inset-s--1/-2',
        'inset-s-1/-2',
        'inset-s-auto/foo',
        '-inset-s-full/foo',
        'inset-s-full/foo',
        'inset-s-3/4/foo',
        'inset-s-4/foo',
        '-inset-s-4/foo',
        'inset-s-[4px]/foo',
      ],
      css`
        @theme reference {
          --spacing-4: 1rem;
          --inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);
        }
        @tailwind utilities;
      `,
    ),
  ).toEqual('')
})

test('inset-e', async () => {
  expect(
    await run(
      [
        'inset-e-shadowned',
        'inset-e-auto',
        '-inset-e-full',
        'inset-e-full',
        'inset-e-3/4',
        'inset-e-4',
        '-inset-e-4',
        'inset-e-[4px]',
      ],
      css`
        @theme {
          --spacing-4: 1rem;
          --inset-shadowned: 1940px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
      --inset-shadowned: 1940px;
    }

    .-inset-e-4 {
      inset-inline-end: calc(var(--spacing-4) * -1);
    }

    .-inset-e-full {
      inset-inline-end: -100%;
    }

    .inset-e-3\\/4 {
      inset-inline-end: 75%;
    }

    .inset-e-4 {
      inset-inline-end: var(--spacing-4);
    }

    .inset-e-\\[4px\\] {
      inset-inline-end: 4px;
    }

    .inset-e-auto {
      inset-inline-end: auto;
    }

    .inset-e-full {
      inset-inline-end: 100%;
    }

    .inset-e-shadowned {
      inset-inline-end: var(--inset-shadowned);
    }
    "
  `)
  expect(
    await run(
      [
        'inset-e-shadow-sm',
        'inset-e',
        'inset-e--1',
        'inset-e--1/2',
        'inset-e--1/-2',
        'inset-e-1/-2',
        'inset-e-auto/foo',
        '-inset-e-full/foo',
        'inset-e-full/foo',
        'inset-e-3/4/foo',
        'inset-e-4/foo',
        '-inset-e-4/foo',
        'inset-e-[4px]/foo',
      ],
      css`
        @theme reference {
          --spacing-4: 1rem;
          --inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);
        }
        @tailwind utilities;
      `,
    ),
  ).toEqual('')
})

test('inset-bs', async () => {
  expect(
    await run(
      [
        'inset-bs-shadowned',
        'inset-bs-auto',
        '-inset-bs-full',
        'inset-bs-full',
        'inset-bs-3/4',
        'inset-bs-4',
        '-inset-bs-4',
        'inset-bs-[4px]',
      ],
      css`
        @theme {
          --spacing-4: 1rem;
          --inset-shadowned: 1940px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
      --inset-shadowned: 1940px;
    }

    .-inset-bs-4 {
      inset-block-start: calc(var(--spacing-4) * -1);
    }

    .-inset-bs-full {
      inset-block-start: -100%;
    }

    .inset-bs-3\\/4 {
      inset-block-start: 75%;
    }

    .inset-bs-4 {
      inset-block-start: var(--spacing-4);
    }

    .inset-bs-\\[4px\\] {
      inset-block-start: 4px;
    }

    .inset-bs-auto {
      inset-block-start: auto;
    }

    .inset-bs-full {
      inset-block-start: 100%;
    }

    .inset-bs-shadowned {
      inset-block-start: var(--inset-shadowned);
    }
    "
  `)
  expect(
    await run(
      [
        'inset-bs-shadow-sm',
        'inset-bs',
        'inset-bs--1',
        'inset-bs--1/2',
        'inset-bs--1/-2',
        'inset-bs-1/-2',
        'inset-bs-auto/foo',
        '-inset-bs-full/foo',
        'inset-bs-full/foo',
        'inset-bs-3/4/foo',
        'inset-bs-4/foo',
        '-inset-bs-4/foo',
        'inset-bs-[4px]/foo',
      ],
      css`
        @theme reference {
          --spacing-4: 1rem;
          --inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);
        }
        @tailwind utilities;
      `,
    ),
  ).toEqual('')
})

test('inset-be', async () => {
  expect(
    await run(
      [
        'inset-be-shadowned',
        'inset-be-auto',
        '-inset-be-full',
        'inset-be-full',
        'inset-be-3/4',
        'inset-be-4',
        '-inset-be-4',
        'inset-be-[4px]',
      ],
      css`
        @theme {
          --spacing-4: 1rem;
          --inset-shadowned: 1940px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
      --inset-shadowned: 1940px;
    }

    .-inset-be-4 {
      inset-block-end: calc(var(--spacing-4) * -1);
    }

    .-inset-be-full {
      inset-block-end: -100%;
    }

    .inset-be-3\\/4 {
      inset-block-end: 75%;
    }

    .inset-be-4 {
      inset-block-end: var(--spacing-4);
    }

    .inset-be-\\[4px\\] {
      inset-block-end: 4px;
    }

    .inset-be-auto {
      inset-block-end: auto;
    }

    .inset-be-full {
      inset-block-end: 100%;
    }

    .inset-be-shadowned {
      inset-block-end: var(--inset-shadowned);
    }
    "
  `)
  expect(
    await run(
      [
        'inset-be-shadow-sm',
        'inset-be',
        'inset-be--1',
        'inset-be--1/2',
        'inset-be--1/-2',
        'inset-be-1/-2',
        'inset-be-auto/foo',
        '-inset-be-full/foo',
        'inset-be-full/foo',
        'inset-be-3/4/foo',
        'inset-be-4/foo',
        '-inset-be-4/foo',
        'inset-be-[4px]/foo',
      ],
      css`
        @theme reference {
          --spacing-4: 1rem;
          --inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);
        }
        @tailwind utilities;
      `,
    ),
  ).toEqual('')
})

test('top', async () => {
  expect(
    await run(
      [
        'top-shadowned',
        'top-auto',
        '-top-full',
        'top-full',
        'top-3/4',
        'top-4',
        '-top-4',
        'top-[4px]',
      ],
      css`
        @theme {
          --spacing-4: 1rem;
          --inset-shadowned: 1940px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
      --inset-shadowned: 1940px;
    }

    .-top-4 {
      top: calc(var(--spacing-4) * -1);
    }

    .-top-full {
      top: -100%;
    }

    .top-3\\/4 {
      top: 75%;
    }

    .top-4 {
      top: var(--spacing-4);
    }

    .top-\\[4px\\] {
      top: 4px;
    }

    .top-auto {
      top: auto;
    }

    .top-full {
      top: 100%;
    }

    .top-shadowned {
      top: var(--inset-shadowned);
    }
    "
  `)
  expect(
    await run(
      [
        'top-shadow-sm',
        'top',
        'top--1',
        'top--1/2',
        'top--1/-2',
        'top-1/-2',
        'top-auto/foo',
        '-top-full/foo',
        'top-full/foo',
        'top-3/4/foo',
        'top-4/foo',
        '-top-4/foo',
        'top-[4px]/foo',
      ],
      css`
        @theme reference {
          --spacing-4: 1rem;
          --inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);
        }
        @tailwind utilities;
      `,
    ),
  ).toEqual('')
})

test('right', async () => {
  expect(
    await run(
      [
        'right-shadowned',
        'right-auto',
        '-right-full',
        'right-full',
        'right-3/4',
        'right-4',
        '-right-4',
        'right-[4px]',
      ],
      css`
        @theme {
          --spacing-4: 1rem;
          --inset-shadowned: 1940px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-4: 1rem;
      --inset-shadowned: 1940px;
    }

    .-right-4 {
      right: calc(var(--spacing-4) * -1);
    }

    .-right-full {
      right: -100%;
    }

    .right-3\\/4 {
      right: 75%;
    }

    .right-4 {
      right: var(--spacing-4);
    }

    .right-\\[4px\\] {
      right: 4px;
    }

    .right-auto {
      right: auto;
    }

    .right-full {
      right: 100%;
    }

    .right-shadowned {
      right: var(--inset-shadowned);
    }
    "
  `)
  expect(
    await run(
      [
        'right-shadow-sm',
        'right',
        'right--1',
        'right--1/2',
        'right--1/-2',
        'right-1/-2',
        'right-auto/foo',
        '-right-full/foo',
        'right-full/foo',
        'right-3/4/foo',
        'right-4/foo',
        '-right-4/foo',
        'right-[4px]/foo',
      ],
      css`
        @theme reference {
          --spacing-4: 1rem;
          --inset-shadow-sm: inset 0 1px 1px rgb(0 0 0 / 0.05);
        }
        @tailwind utilities;
      `,
    ),
  ).toEqual('')
})

