/**
 * Extracted from tailwindcss/packages/tailwindcss/src/variants.test.ts
 *
 * These tests show the expected CSS output for each utility class.
 * Use as reference when implementing PHP utilities.
 */

import { expect, test } from 'vitest'
import { compileCss, run } from './test-utils/run'

test('variant order', async () => {
  expect(
    await run(
      [
        '[&_p]:flex',
        '2xl:flex',
        'active:flex',
        'after:flex',
        'aria-[custom=true]:flex',
        'aria-busy:flex',
        'aria-checked:flex',
        'aria-disabled:flex',
        'aria-expanded:flex',
        'aria-hidden:flex',
        'aria-pressed:flex',
        'aria-readonly:flex',
        'aria-required:flex',
        'aria-selected:flex',
        'autofill:flex',
        'backdrop:flex',
        'before:flex',
        'checked:flex',
        'contrast-less:flex',
        'contrast-more:flex',
        'dark:flex',
        'data-custom:flex',
        'data-[custom=true]:flex',
        'default:flex',
        'details-content:flex',
        'disabled:flex',
        'empty:flex',
        'enabled:flex',
        'even:flex',
        'file:flex',
        'first-letter:flex',
        'first-line:flex',
        'first-of-type:flex',
        'first:flex',
        'focus-visible:flex',
        'focus-within:flex',
        'focus:flex',
        'forced-colors:flex',
        'group-hover:flex',
        'has-[:hover]:flex',
        'hover:flex',
        'in-range:flex',
        'indeterminate:flex',
        'invalid:flex',
        'landscape:flex',
        'last-of-type:flex',
        'last:flex',
        'lg:flex',
        'ltr:flex',
        'marker:flex',
        'md:flex',
        'motion-reduce:flex',
        'motion-safe:flex',
        'odd:flex',
        'only-of-type:flex',
        'only:flex',
        'open:flex',
        'optional:flex',
        'out-of-range:flex',
        'peer-hover:flex',
        'placeholder-shown:flex',
        'placeholder:flex',
        'portrait:flex',
        'print:flex',
        'read-only:flex',
        'required:flex',
        'rtl:flex',
        'selection:flex',
        'sm:flex',
        'supports-[display:flex]:flex',
        'target:flex',
        'valid:flex',
        'visited:flex',
        'xl:flex',
      ],
      css`
        @theme {
          --breakpoint-sm: 640px;
          --breakpoint-md: 768px;
          --breakpoint-lg: 1024px;
          --breakpoint-xl: 1280px;
          --breakpoint-2xl: 1536px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @layer properties {
      @supports (((-webkit-hyphens: none)) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {
        *, :before, :after, ::backdrop {
          --tw-content: "";
        }
      }
    }

    @media (hover: hover) {
      .group-hover\\:flex:is(:where(.group):hover *), .peer-hover\\:flex:is(:where(.peer):hover ~ *) {
        display: flex;
      }
    }

    .first-letter\\:flex:first-letter, .first-line\\:flex:first-line {
      display: flex;
    }

    .marker\\:flex ::marker {
      display: flex;
    }

    .marker\\:flex::marker {
      display: flex;
    }

    .marker\\:flex ::-webkit-details-marker {
      display: flex;
    }

    .marker\\:flex::-webkit-details-marker {
      display: flex;
    }

    .selection\\:flex ::selection {
      display: flex;
    }

    .selection\\:flex::selection {
      display: flex;
    }

    .file\\:flex::file-selector-button {
      display: flex;
    }

    .placeholder\\:flex::placeholder, .backdrop\\:flex::backdrop {
      display: flex;
    }

    .details-content\\:flex::details-content {
      display: flex;
    }

    .before\\:flex:before, .after\\:flex:after {
      content: var(--tw-content);
      display: flex;
    }

    .first\\:flex:first-child, .last\\:flex:last-child, .only\\:flex:only-child, .odd\\:flex:nth-child(odd), .even\\:flex:nth-child(2n), .first-of-type\\:flex:first-of-type, .last-of-type\\:flex:last-of-type, .only-of-type\\:flex:only-of-type, .visited\\:flex:visited, .target\\:flex:target, .open\\:flex:is([open], :popover-open, :open), .default\\:flex:default, .checked\\:flex:checked, .indeterminate\\:flex:indeterminate, .placeholder-shown\\:flex:placeholder-shown {
      display: flex;
    }

    .autofill\\:flex:autofill {
      display: flex;
    }

    .optional\\:flex:optional, .required\\:flex:required, .valid\\:flex:valid, .invalid\\:flex:invalid, .in-range\\:flex:in-range, .out-of-range\\:flex:out-of-range, .read-only\\:flex:read-only, .empty\\:flex:empty, .focus-within\\:flex:focus-within {
      display: flex;
    }

    @media (hover: hover) {
      .hover\\:flex:hover {
        display: flex;
      }
    }

    .focus\\:flex:focus, .focus-visible\\:flex:focus-visible, .active\\:flex:active, .enabled\\:flex:enabled, .disabled\\:flex:disabled, .has-\\[\\:hover\\]\\:flex:has(:hover), .aria-busy\\:flex[aria-busy="true"], .aria-checked\\:flex[aria-checked="true"], .aria-disabled\\:flex[aria-disabled="true"], .aria-expanded\\:flex[aria-expanded="true"], .aria-hidden\\:flex[aria-hidden="true"], .aria-pressed\\:flex[aria-pressed="true"], .aria-readonly\\:flex[aria-readonly="true"], .aria-required\\:flex[aria-required="true"], .aria-selected\\:flex[aria-selected="true"], .aria-\\[custom\\=true\\]\\:flex[aria-custom="true"], .data-custom\\:flex[data-custom], .data-\\[custom\\=true\\]\\:flex[data-custom="true"] {
      display: flex;
    }

    @supports (display: flex) {
      .supports-\\[display\\:flex\\]\\:flex {
        display: flex;
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      .motion-safe\\:flex {
        display: flex;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .motion-reduce\\:flex {
        display: flex;
      }
    }

    @media (prefers-contrast: more) {
      .contrast-more\\:flex {
        display: flex;
      }
    }

    @media (prefers-contrast: less) {
      .contrast-less\\:flex {
        display: flex;
      }
    }

    @media (min-width: 640px) {
      .sm\\:flex {
        display: flex;
      }
    }

    @media (min-width: 768px) {
      .md\\:flex {
        display: flex;
      }
    }

    @media (min-width: 1024px) {
      .lg\\:flex {
        display: flex;
      }
    }

    @media (min-width: 1280px) {
      .xl\\:flex {
        display: flex;
      }
    }

    @media (min-width: 1536px) {
      .\\32 xl\\:flex {
        display: flex;
      }
    }

    @media (orientation: portrait) {
      .portrait\\:flex {
        display: flex;
      }
    }

    @media (orientation: landscape) {
      .landscape\\:flex {
        display: flex;
      }
    }

    .ltr\\:flex:where(:dir(ltr), [dir="ltr"], [dir="ltr"] *), .rtl\\:flex:where(:dir(rtl), [dir="rtl"], [dir="rtl"] *) {
      display: flex;
    }

    @media (prefers-color-scheme: dark) {
      .dark\\:flex {
        display: flex;
      }
    }

    @media print {
      .print\\:flex {
        display: flex;
      }
    }

    @media (forced-colors: active) {
      .forced-colors\\:flex {
        display: flex;
      }
    }

    .\\[\\&_p\\]\\:flex p {
      display: flex;
    }

    @property --tw-content {
      syntax: "*";
      inherits: false;
      initial-value: "";
    }
    "
  `)
})

test('variants with the same root are sorted deterministically', async () => {
  function permute(arr: string[]): string[][] {
    if (arr.length <= 1) return [arr]

    return arr.flatMap((item, i) =>
      permute([...arr.slice(0, i), ...arr.slice(i + 1)]).map((permutation) => [
        item,
        ...permutation,
      ]),
    )
  }

  let classLists = permute([
    'data-hover:flex',
    'data-focus:flex',
    'data-active:flex',
    'data-[foo]:flex',
    'data-[bar]:flex',
    'data-[baz]:flex',
  ])

  for (let classList of classLists) {
    expect(await run(classList)).toMatchInlineSnapshot(`
      "
      .data-active\\:flex[data-active], .data-focus\\:flex[data-focus], .data-hover\\:flex[data-hover], .data-\\[bar\\]\\:flex[data-bar], .data-\\[baz\\]\\:flex[data-baz], .data-\\[foo\\]\\:flex[data-foo] {
        display: flex;
      }
      "
    `)
  }
})

test('matchVariant sorts deterministically', async () => {
  function permute(arr: string[]): string[][] {
    if (arr.length <= 1) return [arr]

    return arr.flatMap((item, i) =>
      permute([...arr.slice(0, i), ...arr.slice(i + 1)]).map((permutation) => [
        item,
        ...permutation,
      ]),
    )
  }

  let classLists = permute([
    'is-data:flex',
    'is-data-foo:flex',
    'is-data-bar:flex',
    'is-data-[potato]:flex',
    'is-data-[sandwich]:flex',
  ])

  for (let classList of classLists) {
    expect(
      await run(classList, '@tailwind utilities; @plugin "./plugin.js";', {
        async loadModule(_id: string) {
          return {
            path: '',
            base: '/',
            module: createPlugin(({ matchVariant }) => {
              matchVariant('is-data', (value) => `&:is([data-${value}])`, {
                values: {
                  DEFAULT: 'default',
                  foo: 'foo',
                  bar: 'bar',
                },
              })
            }),
          }
        },
      }),
    ).toMatchInlineSnapshot(`
      "
      .is-data\\:flex[data-default], .is-data-foo\\:flex[data-foo], .is-data-bar\\:flex[data-bar], .is-data-\\[potato\\]\\:flex[data-potato], .is-data-\\[sandwich\\]\\:flex[data-sandwich] {
        display: flex;
      }
      "
    `)
  }
})

test('move modifier of compound variant to sub-variant if its also a compound variant', async () => {
  expect(
    await run([
      'not-group-focus/name:flex',
      'has-group-focus/name:flex',
      'in-group-focus/name:flex',

      // Keep the `name` on the `group`, don't move it to the `peer` because
      // that would be a breaking change.
      'group-peer-focus/name:flex',
    ]),
  ).toMatchInlineSnapshot(`
    "
    .not-group-focus\\/name\\:flex:not(:is(:where(.group\\/name):focus *)), .group-peer-focus\\/name\\:flex:is(:where(.group\\/name):is(:where(.peer):focus ~ *) *), :where(:is(:where(.group\\/name):focus *)) .in-group-focus\\/name\\:flex, .has-group-focus\\/name\\:flex:has(:is(:where(.group\\/name):focus *)) {
      display: flex;
    }
    "
  `)
})

