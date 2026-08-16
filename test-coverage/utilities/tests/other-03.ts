/**
 * Extracted from tailwindcss/packages/tailwindcss/src/utilities.test.ts
 *
 * These tests show the expected CSS output for each utility class.
 * Use as reference when implementing PHP utilities.
 */

import { expect, test } from 'vitest'
import { compileCss, run } from './test-utils/run'

test('resolving unsupported bare values', async () => {
  using spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  let input = css`
    @utility example-* {
      --resolved-value: --value(color);
    }

    @tailwind utilities;
  `

  expect(await run(['example-#0088cc', 'example-foo'], input)).toEqual('')
  expect(
    `\n${spy.mock.calls
      .map((c) => c.join(' '))
      .join('\n')
      .trim()}\n`,
  ).toMatchInlineSnapshot(`
    "
    Unsupported bare value data type: "color".
    Only valid data types are: "number", "integer", "ratio", "percentage".

    \`\`\`css
    --value(color)
            ^^^^^
    \`\`\`
    "
  `)
})

test('resolving arbitrary values', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: --value([integer]);
    }

    @tailwind utilities;
  `

  expect(
    await run(
      [
        'example-[1]',
        'example-[76]',
        'example-[971]',
        'example-[integer:var(--my-value)]',
        'example-(integer:my-value)',
      ],
      input,
    ),
  ).toMatchInlineSnapshot(`
    "
    .example-\\[1\\] {
      --resolved-value: 1;
    }

    .example-\\[76\\] {
      --resolved-value: 76;
    }

    .example-\\[971\\] {
      --resolved-value: 971;
    }

    .example-\\[integer\\:var\\(--my-value\\)\\] {
      --resolved-value: var(--my-value);
    }
    "
  `)
  expect(
    await run(
      [
        'example-[#0088cc]',
        'example-[1px]',
        'example-[var(--my-value)]',
        'example-(--my-value)',
        'example-[color:var(--my-value)]',
        'example-(color:--my-value)',
      ],
      input,
    ),
  ).toEqual('')
})

test('resolving any arbitrary values', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: --value([*]);
    }

    @tailwind utilities;
  `

  expect(
    await run(
      [
        'example-[1]',
        'example-[76]',
        'example-[971]',
        'example-[var(--my-value)]',
        'example-(--my-value)',
      ],
      input,
    ),
  ).toMatchInlineSnapshot(`
    "
    .example-\\(--my-value\\) {
      --resolved-value: var(--my-value);
    }

    .example-\\[1\\] {
      --resolved-value: 1;
    }

    .example-\\[76\\] {
      --resolved-value: 76;
    }

    .example-\\[971\\] {
      --resolved-value: 971;
    }

    .example-\\[var\\(--my-value\\)\\] {
      --resolved-value: var(--my-value);
    }
    "
  `)
})

test('resolving any arbitrary values (without space)', async () => {
  let input = `
    @utility example-* {
      --resolved-value: --value([*]);
    }

    @tailwind utilities;
  `

  expect(
    await run(
      [
        'example-[1]',
        'example-[76]',
        'example-[971]',
        'example-[var(--my-value)]',
        'example-(--my-value)',
      ],
      input,
    ),
  ).toMatchInlineSnapshot(`
    "
    .example-\\(--my-value\\) {
      --resolved-value: var(--my-value);
    }

    .example-\\[1\\] {
      --resolved-value: 1;
    }

    .example-\\[76\\] {
      --resolved-value: 76;
    }

    .example-\\[971\\] {
      --resolved-value: 971;
    }

    .example-\\[var\\(--my-value\\)\\] {
      --resolved-value: var(--my-value);
    }
    "
  `)
})

test('resolving any arbitrary values (with escaped `*`)', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: --value([\*]);
    }

    @tailwind utilities;
  `

  expect(
    await run(
      [
        'example-[1]',
        'example-[76]',
        'example-[971]',
        'example-[var(--my-value)]',
        'example-(--my-value)',
      ],
      input,
    ),
  ).toMatchInlineSnapshot(`
    "
    .example-\\(--my-value\\) {
      --resolved-value: var(--my-value);
    }

    .example-\\[1\\] {
      --resolved-value: 1;
    }

    .example-\\[76\\] {
      --resolved-value: 76;
    }

    .example-\\[971\\] {
      --resolved-value: 971;
    }

    .example-\\[var\\(--my-value\\)\\] {
      --resolved-value: var(--my-value);
    }
    "
  `)
})

test('resolving theme, bare and arbitrary values all at once', async () => {
  let input = css`
    @theme reference {
      --example-a: 8;
    }

    @utility example-* {
      --resolved-value: --value([integer]);
      --resolved-value: --value(integer);
      --resolved-value: --value(--example);
    }

    @tailwind utilities;
  `

  expect(await run(['example-a', 'example-76', 'example-[123]'], input)).toMatchInlineSnapshot(`
    "
    .example-76 {
      --resolved-value: 76;
    }

    .example-\\[123\\] {
      --resolved-value: 123;
    }

    .example-a {
      --resolved-value: var(--example-a, 8);
    }
    "
  `)
  expect(await run(['example-[#0088cc]', 'example-[1px]'], input)).toEqual('')
})

test('in combination with calc to produce different data types of values', async () => {
  let input = css`
    @theme reference {
      --example-full: 100%;
    }

    @utility example-* {
      --resolved-value: --value([percentage]);
      --resolved-value: calc(--value(integer) * 1%);
      --resolved-value: --value(--example);
    }

    @tailwind utilities;
  `

  expect(await run(['example-full', 'example-12', 'example-[20%]'], input))
    .toMatchInlineSnapshot(`
      "
      .example-12 {
        --resolved-value: calc(12 * 1%);
      }

      .example-\\[20\\%\\] {
        --resolved-value: 20%;
      }

      .example-full {
        --resolved-value: var(--example-full, 100%);
      }
      "
    `)
  expect(await run(['example-half', 'example-[#0088cc]'], input)).toEqual('')
})

test('shorthand if resulting values are of the same type', async () => {
  let input = css`
    @theme reference {
      --example-full: 100%;
    }

    @utility example-* {
      --resolved-value: calc(--value(integer) * 1%);
      --resolved-value: --value(--example, [percentage]);
    }

    @tailwind utilities;
  `

  expect(await run(['example-37', 'example-[50%]', 'example-full'], input))
    .toMatchInlineSnapshot(`
      "
      .example-37 {
        --resolved-value: calc(37 * 1%);
      }

      .example-\\[50\\%\\] {
        --resolved-value: 50%;
      }

      .example-full {
        --resolved-value: var(--example-full, 100%);
      }
      "
    `)
  expect(await run(['example-foo', 'example-[13px]'], input)).toEqual('')
})

test('negative values', async () => {
  let input = css`
    @theme reference {
      --example-full: 100%;
    }

    @utility example-* {
      --resolved-value: --value(--example, [percentage], [length]);
    }

    @utility -example-* {
      --resolved-value: calc(--value(--example, [percentage], [length]) * -1);
    }

    @tailwind utilities;
  `

  expect(
    await run(
      [
        'example-full',
        '-example-full',
        'example-[10px]',
        '-example-[10px]',
        'example-[20%]',
        '-example-[20%]',
      ],
      input,
    ),
  ).toMatchInlineSnapshot(`
    "
    .-example-\\[10px\\] {
      --resolved-value: calc(10px * -1);
    }

    .-example-\\[20\\%\\] {
      --resolved-value: calc(20% * -1);
    }

    .-example-full {
      --resolved-value: calc(var(--example-full, 100%) * -1);
    }

    .example-\\[10px\\] {
      --resolved-value: 10px;
    }

    .example-\\[20\\%\\] {
      --resolved-value: 20%;
    }

    .example-full {
      --resolved-value: var(--example-full, 100%);
    }
    "
  `)
  expect(await run(['example-10'], input)).toEqual('')
})

test('using the same value multiple times', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: calc(var(--spacing) * --value(number))
        calc(var(--spacing) * --value(number));
    }

    @tailwind utilities;
  `

  expect(await run(['example-12'], input)).toMatchInlineSnapshot(`
    "
    .example-12 {
      --resolved-value: calc(var(--spacing) * 12)
                calc(var(--spacing) * 12);
    }
    "
  `)
})

test('using `--spacing(…)` shorthand', async () => {
  let input = css`
    @theme {
      --spacing: 4px;
    }

    @utility example-* {
      margin: --spacing(--value(number));
    }

    @tailwind utilities;
  `

  expect(await run(['example-12'], input)).toMatchInlineSnapshot(`
    "
    :root, :host {
      --spacing: 4px;
    }

    .example-12 {
      margin: calc(var(--spacing) * 12);
    }
    "
  `)
})

test('using `--spacing(…)` shorthand (inline theme)', async () => {
  let input = css`
    @theme inline reference {
      --spacing: 4px;
    }

    @utility example-* {
      margin: --spacing(--value(number));
    }

    @tailwind utilities;
  `

  expect(await run(['example-12'], input)).toMatchInlineSnapshot(`
    "
    .example-12 {
      margin: 48px;
    }
    "
  `)
})

test('functional utilities can use `--default(…)` in `--value(…)`', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: --value(integer, --default(4));
    }

    @tailwind utilities;
  `

  expect(await run(['example', 'example-123'], input)).toMatchInlineSnapshot(`
    "
    .example {
      --resolved-value: 4;
    }

    .example-123 {
      --resolved-value: 123;
    }
    "
  `)

  expect(await run(['example-foo'], input)).toEqual('')
})

test('functional utilities can use `--default(…)` in complex expressions', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: calc(--value(integer, --default(4)) * 2);
    }

    @tailwind utilities;
  `

  expect(await run(['example', 'example-123'], input)).toMatchInlineSnapshot(`
    "
    .example {
      --resolved-value: calc(4 * 2);
    }

    .example-123 {
      --resolved-value: calc(123 * 2);
    }
    "
  `)

  expect(await run(['example-foo'], input)).toEqual('')
})

test('functional utilities can use `--default(…)` with `--modifier(…)`', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: --value(integer, --default(4));
      --resolved-modifier: --modifier(integer);
    }

    @tailwind utilities;
  `

  expect(await run(['example', 'example/25'], input)).toMatchInlineSnapshot(`
    "
    .example\\/25 {
      --resolved-value: 4;
      --resolved-modifier: 25;
    }

    .example {
      --resolved-value: 4;
    }
    "
  `)

  expect(await run(['example/foo'], input)).toEqual('')
})

test('functional utilities can use `--default(…)` in `--modifier(…)`', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: --value(integer);
      --resolved-modifier: --modifier(integer, --default(1));
    }

    @tailwind utilities;
  `

  expect(await run(['example-123', 'example-123/25'], input)).toMatchInlineSnapshot(`
    "
    .example-123 {
      --resolved-value: 123;
      --resolved-modifier: 1;
    }

    .example-123\\/25 {
      --resolved-value: 123;
      --resolved-modifier: 25;
    }
    "
  `)

  expect(await run(['example-123/foo'], input)).toEqual('')
})

test('functional utilities can use `--default(…)` in `--value(…)` and `--modifier(…)`', async () => {
  let input = css`
    @utility example-* {
      --resolved-value: --value(integer, --default(12));
      --resolved-modifier: --modifier(integer, --default(34));
    }

    @tailwind utilities;
  `

  expect(await run(['example', 'example/1', 'example-1', 'example-1/1'], input))
    .toMatchInlineSnapshot(`
      "
      .example {
        --resolved-value: 12;
        --resolved-modifier: 34;
      }

      .example-1 {
        --resolved-value: 1;
        --resolved-modifier: 34;
      }

      .example-1\\/1 {
        --resolved-value: 1;
        --resolved-modifier: 1;
      }

      .example\\/1 {
        --resolved-value: 12;
        --resolved-modifier: 1;
      }
      "
    `)

  expect(await run(['example-123/foo'], input)).toEqual('')
})

test('modifiers', async () => {
  let input = css`
    @theme reference {
      --value-sm: 14px;
      --modifier-7: 28px;
    }

    @utility example-* {
      --resolved-value: --value(--value, [length]);
      --resolved-modifier: --modifier(--modifier, [length]);
      --resolved-modifier-with-calc: calc(--modifier(--modifier, [length]) * 2);
      --resolved-modifier-literals: --modifier('literal', 'literal-2');
    }

    @tailwind utilities;
  `

  expect(
    await run(
      [
        'example-sm',
        'example-sm/7',
        'example-[12px]',
        'example-[12px]/[16px]',
        'example-sm/literal',
        'example-sm/literal-2',
      ],
      input,
    ),
  ).toMatchInlineSnapshot(`
    "
    .example-\\[12px\\]\\/\\[16px\\] {
      --resolved-value: 12px;
      --resolved-modifier: 16px;
      --resolved-modifier-with-calc: calc(16px * 2);
    }

    .example-sm\\/7 {
      --resolved-value: var(--value-sm, 14px);
      --resolved-modifier: var(--modifier-7, 28px);
      --resolved-modifier-with-calc: calc(var(--modifier-7, 28px) * 2);
    }

    .example-sm\\/literal {
      --resolved-value: var(--value-sm, 14px);
      --resolved-modifier-literals: literal;
    }

    .example-sm\\/literal-2 {
      --resolved-value: var(--value-sm, 14px);
      --resolved-modifier-literals: literal-2;
    }

    .example-\\[12px\\] {
      --resolved-value: 12px;
    }

    .example-sm {
      --resolved-value: var(--value-sm, 14px);
    }
    "
  `)
  expect(
    await run(
      ['example-foo', 'example-foo/[12px]', 'example-foo/12', 'example-sm/unknown-literal'],
      input,
    ),
  ).toEqual('')
})

test('fractions', async () => {
  let input = css`
    @theme reference {
      --example-video: 16 / 9;
    }

    @utility example-* {
      --resolved-value: --value(--example, ratio, [ratio]);
    }

    @tailwind utilities;
  `

  expect(await run(['example-video', 'example-1/1', 'example-[7/9]'], input))
    .toMatchInlineSnapshot(`
      "
      .example-1\\/1 {
        --resolved-value: 1 / 1;
      }

      .example-\\[7\\/9\\] {
        --resolved-value: 7/9;
      }

      .example-video {
        --resolved-value: var(--example-video, 16 / 9);
      }
      "
    `)
  expect(await run(['example-foo'], input)).toEqual('')
})

test('resolve theme values with sub-namespace (--text- * --line-height)', async () => {
  let input = css`
    @theme reference {
      --text-xs: 0.75rem;
      --text-xs--line-height: calc(1 / 0.75);
    }

    @utility example-* {
      font-size: --value(--text);
      line-height: --value(--text-* --line-height);
      line-height: --modifier(number);
    }

    @tailwind utilities;
  `

  expect(await run(['example-xs', 'example-xs/6'], input)).toMatchInlineSnapshot(`
    "
    .example-xs\\/6 {
      font-size: var(--text-xs, .75rem);
      line-height: var(--text-xs--line-height, calc(1 / .75));
      line-height: 6;
    }

    .example-xs {
      font-size: var(--text-xs, .75rem);
      line-height: var(--text-xs--line-height, calc(1 / .75));
    }
    "
  `)
  expect(await run(['example-foo', 'example-xs/foo'], input)).toEqual('')
})

test('resolve theme values with sub-namespace (--text-\\* --line-height)', async () => {
  let input = css`
    @theme reference {
      --text-xs: 0.75rem;
      --text-xs--line-height: calc(1 / 0.75);
    }

    @utility example-* {
      font-size: --value(--text);
      line-height: --value(--text-\* --line-height);
      line-height: --modifier(number);
    }

    @tailwind utilities;
  `

  expect(await run(['example-xs', 'example-xs/6'], input)).toMatchInlineSnapshot(`
    "
    .example-xs\\/6 {
      font-size: var(--text-xs, .75rem);
      line-height: var(--text-xs--line-height, calc(1 / .75));
      line-height: 6;
    }

    .example-xs {
      font-size: var(--text-xs, .75rem);
      line-height: var(--text-xs--line-height, calc(1 / .75));
    }
    "
  `)
  expect(await run(['example-foo', 'example-xs/foo'], input)).toEqual('')
})

test('resolve theme values with sub-namespace (--value(--text --line-height))', async () => {
  let input = css`
    @theme reference {
      --text-xs: 0.75rem;
      --text-xs--line-height: calc(1 / 0.75);
    }

    @utility example-* {
      font-size: --value(--text);
      line-height: --value(--text --line-height);
      line-height: --modifier(number);
    }

    @tailwind utilities;
  `

  expect(await run(['example-xs', 'example-xs/6'], input)).toMatchInlineSnapshot(`
    "
    .example-xs\\/6 {
      font-size: var(--text-xs, .75rem);
      line-height: var(--text-xs--line-height, calc(1 / .75));
      line-height: 6;
    }

    .example-xs {
      font-size: var(--text-xs, .75rem);
      line-height: var(--text-xs--line-height, calc(1 / .75));
    }
    "
  `)
  expect(await run(['example-foo', 'example-xs/foo'], input)).toEqual('')
})

test('resolve theme values with sub-namespace (--value(--text-*--line-height))', async () => {
  let input = `
    @theme reference {
      --text-xs: 0.75rem;
      --text-xs--line-height: calc(1 / 0.75);
    }

    @utility example-* {
      font-size: --value(--text);
      line-height: --value(--text-*--line-height);
      line-height: --modifier(number);
    }

    @tailwind utilities;
  `

  expect(await run(['example-xs', 'example-xs/6'], input)).toMatchInlineSnapshot(`
    "
    .example-xs\\/6 {
      font-size: var(--text-xs, .75rem);
      line-height: var(--text-xs--line-height, calc(1 / .75));
      line-height: 6;
    }

    .example-xs {
      font-size: var(--text-xs, .75rem);
      line-height: var(--text-xs--line-height, calc(1 / .75));
    }
    "
  `)
  expect(await run(['example-foo', 'example-xs/foo'], input)).toEqual('')
})

test('variables used in `@utility` will not be emitted if the utility is not used', async () => {
  let input = css`
    @theme {
      --example-foo: red;
      --color-red-500: #f00;
    }

    @utility example-* {
      color: var(--color-red-500);
      background-color: --value(--example);
    }

    @tailwind utilities;
  `

  expect(await run(['flex'], input)).toMatchInlineSnapshot(`
    "
    .flex {
      display: flex;
    }
    "
  `)
})

test('variables used in `@utility` will be emitted if the utility is used', async () => {
  let input = css`
    @theme {
      --example-foo: red;
      --color-red-500: #f00;
    }

    @utility example-* {
      color: var(--color-red-500);
      background-color: --value(--example);
    }

    @tailwind utilities;
  `

  expect(await run(['example-foo'], input)).toMatchInlineSnapshot(`
    "
    :root, :host {
      --example-foo: red;
      --color-red-500: red;
    }

    .example-foo {
      color: var(--color-red-500);
      background-color: var(--example-foo);
    }
    "
  `)
})

test('declaration nodes are only replaced/removed once', async () => {
  let input = css`
    @utility mask-r-* {
      --mask-right: linear-gradient(to left, transparent, black --value(percentage));
      --mask-right: linear-gradient(
        to left,
        transparent calc(var(--spacing) * --modifier(integer)),
        black calc(var(--spacing) * --value(integer))
      );
      mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
    }

    @tailwind utilities;
  `

  expect(await run(['mask-r-20%'], input)).toMatchInlineSnapshot(`
    "
    .mask-r-20\\% {
      --mask-right: linear-gradient(to left, transparent, black 20%);
      -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
      -webkit-mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
      mask-image: var(--mask-linear), var(--mask-radial), var(--mask-conic);
    }
    "
  `)
})

test('resolve value based on `@theme`', async () => {
  let input = css`
    @theme {
      --example-a: 8;
    }

    @utility example-* {
      --resolved-value: --value(--example);
    }

    @tailwind utilities;
  `

  expect(await run(['example-a'], input)).toMatchInlineSnapshot(`
    "
    :root, :host {
      --example-a: 8;
    }

    .example-a {
      --resolved-value: var(--example-a);
    }
    "
  `)
})

test('resolve value based on `@theme reference`', async () => {
  let input = css`
    @theme reference {
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
      --resolved-value: var(--example-a, 8);
    }
    "
  `)
})

