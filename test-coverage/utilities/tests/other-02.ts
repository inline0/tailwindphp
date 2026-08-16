/**
 * Extracted from tailwindcss/packages/tailwindcss/src/utilities.test.ts
 *
 * These tests show the expected CSS output for each utility class.
 * Use as reference when implementing PHP utilities.
 */

import { expect, test } from 'vitest'
import { compileCss, run } from './test-utils/run'

test('@container', async () => {
  expect(
    await run([
      '@container',
      '@container-normal',
      '@container/sidebar',
      '@container-normal/sidebar',
      '@container-size',
      '@container-size/sidebar',
    ]),
  ).toMatchInlineSnapshot(`
    "
    .\\@container-normal\\/sidebar {
      container: sidebar;
    }

    .\\@container-size\\/sidebar {
      container: sidebar / size;
    }

    .\\@container\\/sidebar {
      container: sidebar / inline-size;
    }

    .\\@container {
      container-type: inline-size;
    }

    .\\@container-normal {
      container-type: normal;
    }

    .\\@container-size {
      container-type: size;
    }
    "
  `)
  expect(
    await run([
      '-@container',
      '-@container-normal',
      '-@container/sidebar',
      '-@container-normal/sidebar',
      '-@container-size',
      '-@container-size/sidebar',
    ]),
  ).toEqual('')
})

test('`--spacing: initial` disables the spacing multiplier', async () => {
  expect(
    await run(
      ['px-1', 'px-4'],
      css`
        @theme {
          --spacing: initial;
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

    .px-4 {
      padding-inline: var(--spacing-4);
    }
    "
  `)
})

test('`--spacing-*: initial` disables the spacing multiplier', async () => {
  expect(
    await run(
      ['px-1', 'px-4'],
      css`
        @theme {
          --spacing-*: initial;
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

    .px-4 {
      padding-inline: var(--spacing-4);
    }
    "
  `)
})

test('only multiples of 0.25 with no trailing zeroes are supported with the spacing multiplier', async () => {
  expect(
    await run(
      ['px-0.25', 'px-1.5', 'px-2.75', 'px-0.375', 'px-2.50', 'px-.75'],
      css`
        @theme {
          --spacing: 4px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing: 4px;
    }

    .px-0\\.25 {
      padding-inline: calc(var(--spacing) * .25);
    }

    .px-1\\.5 {
      padding-inline: calc(var(--spacing) * 1.5);
    }

    .px-2\\.75 {
      padding-inline: calc(var(--spacing) * 2.75);
    }
    "
  `)
})

test('spacing utilities must have a value', async () => {
  expect(
    await run(
      ['px'],
      css`
        @theme reference {
          --spacing: 4px;
        }
        @tailwind utilities;
      `,
    ),
  ).toEqual('')
})

test('--spacing-* variables take precedence over --container-* variables', async () => {
  expect(
    await run(
      ['w-sm', 'max-w-sm', 'min-w-sm', 'basis-sm'],
      css`
        @theme {
          --spacing-sm: 8px;
          --container-sm: 256px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing-sm: 8px;
    }

    .w-sm {
      width: var(--spacing-sm);
    }

    .max-w-sm {
      max-width: var(--spacing-sm);
    }

    .min-w-sm {
      min-width: var(--spacing-sm);
    }

    .basis-sm {
      flex-basis: var(--spacing-sm);
    }
    "
  `)
})

test('custom static utility', async () => {
  expect(
    await run(
      ['text-trim', 'lg:text-trim'],
      css`
        @layer utilities {
          @tailwind utilities;
        }

        @theme reference {
          --breakpoint-lg: 1024px;
        }

        @utility text-trim {
          text-box-trim: both;
          text-box-edge: cap alphabetic;
        }
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer utilities {
      .text-trim {
        text-box-trim: both;
        text-box-edge: cap alphabetic;
      }

      @media (min-width: 1024px) {
        .lg\\:text-trim {
          text-box-trim: both;
          text-box-edge: cap alphabetic;
        }
      }
    }
    "
  `)
})

test('custom static utility emit CSS variables if the utility is used', async () => {
  let input = css`
    @layer utilities {
      @tailwind utilities;
    }

    @theme {
      --example-foo: 123px;
    }

    @utility foo {
      value: var(--example-foo);
    }
  `

  // `foo` is not used yet:
  expect(await compileCss(input)).toMatchInlineSnapshot(`
    "
    @layer utilities;
    "
  `)

  // `foo` is used, and the CSS variable is emitted:
  expect(await run(['foo'], input)).toMatchInlineSnapshot(`
    "
    @layer utilities {
      .foo {
        value: var(--example-foo);
      }
    }

    :root, :host {
      --example-foo: 123px;
    }
    "
  `)
})

test('custom static utility (negative)', async () => {
  expect(
    await run(
      ['-example', 'lg:-example'],
      css`
        @layer utilities {
          @tailwind utilities;
        }

        @utility -example {
          value: -1;
        }
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer utilities {
      .-example {
        value: -1;
      }
    }
    "
  `)
})

test('Multiple static utilities are merged', async () => {
  expect(
    await run(
      ['really-round'],
      css`
        @layer utilities {
          @tailwind utilities;
        }

        @utility really-round {
          --custom-prop: hi;
          border-radius: 50rem;
        }

        @utility really-round {
          border-radius: 30rem;
        }
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer utilities {
      .really-round {
        --custom-prop: hi;
        border-radius: 30rem;
      }
    }
    "
  `)
})

test('custom utilities support some special characters', async () => {
  expect(
    await run(
      ['push-1/2', 'push-50%'],
      css`
        @layer utilities {
          @tailwind utilities;
        }

        @utility push-1/2 {
          right: 50%;
        }

        @utility push-50% {
          right: 50%;
        }
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer utilities {
      .push-1\\/2, .push-50\\% {
        right: 50%;
      }
    }
    "
  `)
})

test('can override specific versions of a functional utility with a static utility', async () => {
  expect(
    await run(
      ['text-sm'],
      css`
        @layer utilities {
          @tailwind utilities;
        }

        @theme reference {
          --text-sm: 0.875rem;
          --text-sm--line-height: 1.25rem;
        }

        @utility text-sm {
          font-size: var(--text-sm, 0.8755rem);
          line-height: var(--text-sm--line-height, 1.255rem);
          text-rendering: optimizeLegibility;
        }
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer utilities {
      .text-sm {
        font-size: var(--text-sm, .8755rem);
        line-height: var(--text-sm--line-height, 1.255rem);
        text-rendering: optimizelegibility;
        font-size: var(--text-sm, .875rem);
        line-height: var(--tw-leading, var(--text-sm--line-height, 1.25rem));
      }
    }
    "
  `)
})

test('can override the default value of a functional utility', async () => {
  expect(
    await run(
      ['rounded', 'rounded-xl', 'rounded-[33px]'],
      css`
        @layer utilities {
          @tailwind utilities;
        }

        @theme reference {
          --radius-xl: 16px;
        }

        @utility rounded {
          border-radius: 50rem;
        }
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer utilities {
      .rounded {
        border-radius: 50rem;
      }

      .rounded-\\[33px\\] {
        border-radius: 33px;
      }

      .rounded-xl {
        border-radius: var(--radius-xl, 16px);
      }
    }
    "
  `)
})

test('custom utilities are sorted by used properties', async () => {
  expect(
    await run(
      ['top-[100px]', 'push-left', 'right-[100px]', 'bottom-[100px]'],
      css`
        @layer utilities {
          @tailwind utilities;
        }

        @utility push-left {
          right: 100%;
        }
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer utilities {
      .top-\\[100px\\] {
        top: 100px;
      }

      .push-left {
        right: 100%;
      }

      .right-\\[100px\\] {
        right: 100px;
      }

      .bottom-\\[100px\\] {
        bottom: 100px;
      }
    }
    "
  `)
})

test('custom utilities must use a valid name definitions', async () => {
  await expect(() =>
    compile(css`
      @utility push-| {
        right: 100%;
      }
    `),
  ).rejects.toThrow(/should be alphanumeric/)

  await expect(() =>
    compile(css`
      @utility ~push {
        right: 100%;
      }
    `),
  ).rejects.toThrow(/should be alphanumeric/)

  await expect(() =>
    compile(css`
      @utility @push {
        right: 100%;
      }
    `),
  ).rejects.toThrow(/should be alphanumeric/)
})

test('custom utilities work with `@apply`', async () => {
  expect(
    await run(
      ['foo', 'hover:foo', 'bar'],
      css`
        @utility foo {
          @apply flex flex-col underline;
        }

        @utility bar {
          @apply z-10;

          .baz {
            @apply z-20;
          }
        }

        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    .bar {
      z-index: 10;
    }

    .bar .baz {
      z-index: 20;
    }

    .foo {
      flex-direction: column;
      text-decoration-line: underline;
      display: flex;
    }

    @media (hover: hover) {
      .hover\\:foo:hover {
        flex-direction: column;
        text-decoration-line: underline;
        display: flex;
      }
    }
    "
  `)
})

test('referencing custom utilities in custom utilities via `@apply` should work', async () => {
  expect(
    await run(
      ['bar'],
      css`
        @utility foo {
          @apply flex flex-col underline;
        }

        @utility bar {
          @apply dark:foo flex-wrap;
        }

        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    .bar {
      flex-wrap: wrap;
    }

    @media (prefers-color-scheme: dark) {
      .bar {
        flex-direction: column;
        text-decoration-line: underline;
        display: flex;
      }
    }
    "
  `)
})

test('custom utilities with `@apply` causing circular dependencies should error', async () => {
  await expect(() =>
    run(
      ['foo', 'bar'],
      css`
        @utility foo {
          @apply flex-wrap hover:bar;
        }

        @utility bar {
          @apply flex dark:foo;
        }

        @tailwind utilities;
      `,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: You cannot \`@apply\` the \`hover:bar\` utility here because it creates a circular dependency.]`,
  )
})

test('custom utilities with `@apply` causing circular dependencies should error (deeply nesting)', async () => {
  await expect(() =>
    run(
      ['foo', 'bar'],
      css`
        @utility foo {
          .bar {
            .baz {
              .qux {
                @apply flex-wrap hover:bar;
              }
            }
          }
        }

        @utility bar {
          .baz {
            .qux {
              @apply flex dark:foo;
            }
          }
        }

        @tailwind utilities;
      `,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: You cannot \`@apply\` the \`hover:bar\` utility here because it creates a circular dependency.]`,
  )
})

test('custom utilities with `@apply` causing circular dependencies should error (multiple levels)', async () => {
  await expect(() =>
    run(
      ['foo', 'bar'],
      css`
        body {
          @apply foo;
        }

        @utility foo {
          @apply flex-wrap hover:bar;
        }

        @utility bar {
          @apply flex dark:baz;
        }

        @utility baz {
          @apply flex-wrap hover:foo;
        }

        @tailwind utilities;
      `,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: You cannot \`@apply\` the \`hover:bar\` utility here because it creates a circular dependency.]`,
  )
})

test('functional utilities require a `--value(…)`', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: 4;
    }

    @tailwind utilities;
  `

  expect(await run(['example', 'example-foo'], input)).toEqual('')
})

test('functional utilities must resolve at least one `--value(…)`', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: --value(integer);
    }

    @tailwind utilities;
  `

  expect(await run(['example-1', 'example-2'], input)).toMatchInlineSnapshot(`
    "
    .example-1 {
      --resolved-value: 1;
    }

    .example-2 {
      --resolved-value: 2;
    }
    "
  `)

  expect(await run(['example', 'example-foo', 'example-2.5'], input)).toEqual('')
})

test('resolving values from `@theme`', async () => {
  let input = css`
    @theme reference {
      --example-1: 1;
      --example-2: 2;
      --example-4: 4;
      --example-a: 8;
    }

    @utility example-* {
      --resolved-value: --value(--example);
    }

    @tailwind utilities;
  `

  expect(await run(['example-1', 'example-2', 'example-4', 'example-a'], input))
    .toMatchInlineSnapshot(`
      "
      .example-1 {
        --resolved-value: var(--example-1, 1);
      }

      .example-2 {
        --resolved-value: var(--example-2, 2);
      }

      .example-4 {
        --resolved-value: var(--example-4, 4);
      }

      .example-a {
        --resolved-value: var(--example-a, 8);
      }
      "
    `)
  expect(await run(['example-3', 'example-gitlab'], input)).toEqual('')
})

test('functional utility with double-dash separator', async () => {
  let input = css`
    @theme reference {
      --color-border-0: #e5e7eb;
      --color-border-1: #d1d5db;
      --color-border-2: #9ca3af;
    }

    @utility border--* {
      border-color: --value(--color-border-*, [color]);
    }

    @tailwind utilities;
  `

  expect(await run(['border--0', 'border--1', 'border--2'], input)).toMatchInlineSnapshot(`
    "
    .border--0 {
      border-color: var(--color-border-0, #e5e7eb);
    }

    .border--1 {
      border-color: var(--color-border-1, #d1d5db);
    }

    .border--2 {
      border-color: var(--color-border-2, #9ca3af);
    }
    "
  `)
  expect(await run(['border--3'], input)).toEqual('')
})

test('resolving values from `@theme`, with `--example-*` syntax', async () => {
  let input =
    // Explicitly not using the css tagged template literal so that
    // Prettier doesn't format the `value(--example-*)` as
    // `value(--example- *)`
    `
      @theme reference {
        --example-1: 1;
        --example-2: 2;
        --example-4: 4;
        --example-a: 8;
      }

      @utility example-* {
        --resolved-value: --value(--example-*);
      }

      @tailwind utilities;
    `

  expect(await run(['example-1', 'example-2', 'example-4', 'example-a'], input))
    .toMatchInlineSnapshot(`
      "
      .example-1 {
        --resolved-value: var(--example-1, 1);
      }

      .example-2 {
        --resolved-value: var(--example-2, 2);
      }

      .example-4 {
        --resolved-value: var(--example-4, 4);
      }

      .example-a {
        --resolved-value: var(--example-a, 8);
      }
      "
    `)
  expect(await run(['example-3', 'example-gitlab'], input)).toEqual('')
})

test('resolving values from `@theme`, with `--example-\\*` syntax (prettier friendly)', async () => {
  let input = css`
    @theme reference {
      --example-1: 1;
      --example-2: 2;
      --example-4: 4;
      --example-a: 8;
    }

    @utility example-* {
      --resolved-value: --value(--example-\*);
    }

    @tailwind utilities;
  `

  expect(await run(['example-1', 'example-2', 'example-4', 'example-a'], input))
    .toMatchInlineSnapshot(`
      "
      .example-1 {
        --resolved-value: var(--example-1, 1);
      }

      .example-2 {
        --resolved-value: var(--example-2, 2);
      }

      .example-4 {
        --resolved-value: var(--example-4, 4);
      }

      .example-a {
        --resolved-value: var(--example-a, 8);
      }
      "
    `)
  expect(await run(['example-3', 'example-gitlab'], input)).toEqual('')
})

test('resolving bare values', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: --value(integer);
    }

    @tailwind utilities;
  `

  expect(await run(['example-1', 'example-76', 'example-971'], input)).toMatchInlineSnapshot(`
    "
    .example-1 {
      --resolved-value: 1;
    }

    .example-76 {
      --resolved-value: 76;
    }

    .example-971 {
      --resolved-value: 971;
    }
    "
  `)
  expect(await run(['example-foo'], input)).toEqual('')
})

test('bare values with unsupported data types should result in a warning', async () => {
  using spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  let input = css`
    @utility paint-* {
      paint: --value([color], color);
    }

    @tailwind utilities;
  `

  expect(await run(['paint-#0088cc', 'paint-red'], input)).toEqual('')
  expect(spy.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Unsupported bare value data type: "color".
    Only valid data types are: "number", "integer", "ratio", "percentage".
    ",
      ],
      [
        "\`\`\`css
    --value([color],color)
                    ^^^^^
    \`\`\`",
      ],
    ]
  `)
})

test('resolve literal values', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: --value('revert');
    }

    @tailwind utilities;
  `

  expect(await run(['example-revert'], input)).toMatchInlineSnapshot(`
    "
    .example-revert {
      --resolved-value: revert;
    }
    "
  `)
  expect(await run(['example-initial'], input)).toEqual('')
})

test('resolving bare values with constraints for integer, percentage, and ratio', async () => {
  let input = css`
    @utility example-* {
      --value-as-number: --value(number);
      --value-as-percentage: --value(percentage);
      --value-as-ratio: --value(ratio);
    }

    @tailwind utilities;
  `

  expect(await run(['example-1', 'example-0.5', 'example-20%', 'example-2/3'], input))
    .toMatchInlineSnapshot(`
      "
      .example-0\\.5 {
        --value-as-number: .5;
      }

      .example-1 {
        --value-as-number: 1;
      }

      .example-2\\/3 {
        --value-as-ratio: 2 / 3;
      }

      .example-20\\% {
        --value-as-percentage: 20%;
      }
      "
    `)
  expect(
    await run(
      ['example-1.23', 'example-12.34%', 'example-1.2/3', 'example-1/2.3', 'example-1.2/3.4'],
      input,
    ),
  ).toEqual('')
})

