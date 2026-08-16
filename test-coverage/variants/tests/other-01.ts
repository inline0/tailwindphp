/**
 * Extracted from tailwindcss/packages/tailwindcss/src/variants.test.ts
 *
 * These tests show the expected CSS output for each utility class.
 * Use as reference when implementing PHP utilities.
 */

import { expect, test } from 'vitest'
import { compileCss, run } from './test-utils/run'

test('*', async () => {
  expect(await run(['*:flex'])).toMatchInlineSnapshot(`
    "
    :is(.\\*\\:flex > *) {
      display: flex;
    }
    "
  `)
  expect(await run(['*/foo:flex'])).toEqual('')
})

test('**', async () => {
  expect(await run(['**:flex'])).toMatchInlineSnapshot(`
    "
    :is(.\\*\\*\\:flex *) {
      display: flex;
    }
    "
  `)
  expect(await run(['**/foo:flex'])).toEqual('')
})

test('details-content', async () => {
  expect(await run(['details-content:flex'])).toMatchInlineSnapshot(`
    "
    .details-content\\:flex::details-content {
      display: flex;
    }
    "
  `)
  expect(await run(['details-content/foo:flex'])).toEqual('')
})

test('only', async () => {
  expect(await run(['only:flex', 'group-only:flex', 'peer-only:flex'])).toMatchInlineSnapshot(`
    "
    .group-only\\:flex:is(:where(.group):only-child *), .peer-only\\:flex:is(:where(.peer):only-child ~ *), .only\\:flex:only-child {
      display: flex;
    }
    "
  `)
  expect(await run(['only/foo:flex'])).toEqual('')
})

test('only-of-type', async () => {
  expect(await run(['only-of-type:flex', 'group-only-of-type:flex', 'peer-only-of-type:flex']))
    .toMatchInlineSnapshot(`
      "
      .group-only-of-type\\:flex:is(:where(.group):only-of-type *), .peer-only-of-type\\:flex:is(:where(.peer):only-of-type ~ *), .only-of-type\\:flex:only-of-type {
        display: flex;
      }
      "
    `)
  expect(await run(['only-of-type/foo:flex'])).toEqual('')
})

test('optional', async () => {
  expect(await run(['optional:flex', 'group-optional:flex', 'peer-optional:flex']))
    .toMatchInlineSnapshot(`
      "
      .group-optional\\:flex:is(:where(.group):optional *), .peer-optional\\:flex:is(:where(.peer):optional ~ *), .optional\\:flex:optional {
        display: flex;
      }
      "
    `)
  expect(await run(['optional/foo:flex'])).toEqual('')
})

test('user-valid', async () => {
  expect(await run(['user-valid:flex', 'group-user-valid:flex', 'peer-user-valid:flex']))
    .toMatchInlineSnapshot(`
      "
      .group-user-valid\\:flex:is(:where(.group):user-valid *), .peer-user-valid\\:flex:is(:where(.peer):user-valid ~ *) {
        display: flex;
      }

      .user-valid\\:flex:user-valid {
        display: flex;
      }
      "
    `)
  expect(await run(['user-valid/foo:flex'])).toEqual('')
})

test('user-invalid', async () => {
  expect(await run(['user-invalid:flex', 'group-user-invalid:flex', 'peer-user-invalid:flex']))
    .toMatchInlineSnapshot(`
      "
      .group-user-invalid\\:flex:is(:where(.group):user-invalid *), .peer-user-invalid\\:flex:is(:where(.peer):user-invalid ~ *) {
        display: flex;
      }

      .user-invalid\\:flex:user-invalid {
        display: flex;
      }
      "
    `)
  expect(await run(['user-invalid/foo:flex'])).toEqual('')
})

test('custom breakpoint', async () => {
  expect(
    await run(
      ['10xl:flex'],
      css`
        @theme {
          --breakpoint-10xl: 5000px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @media (min-width: 5000px) {
      .\\31 0xl\\:flex {
        display: flex;
      }
    }
    "
  `)
})

test('sorting stacked min-* and max-* variants', async () => {
  expect(
    await run(
      ['min-sm:max-lg:flex', 'min-sm:max-xl:flex', 'min-md:max-lg:flex', 'min-xs:max-sm:flex'],
      css`
        @theme {
          /* Explicitly ordered in a strange way */
          --breakpoint-sm: 640px;
          --breakpoint-lg: 1024px;
          --breakpoint-md: 768px;
          --breakpoint-xl: 1280px;
          --breakpoint-xs: 280px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @media (min-width: 280px) {
      @media not all and (min-width: 640px) {
        .min-xs\\:max-sm\\:flex {
          display: flex;
        }
      }
    }

    @media (min-width: 640px) {
      @media not all and (min-width: 1280px) {
        .min-sm\\:max-xl\\:flex {
          display: flex;
        }
      }

      @media not all and (min-width: 1024px) {
        .min-sm\\:max-lg\\:flex {
          display: flex;
        }
      }
    }

    @media (min-width: 768px) {
      @media not all and (min-width: 1024px) {
        .min-md\\:max-lg\\:flex {
          display: flex;
        }
      }
    }
    "
  `)
})

test('stacked min-* and max-* variants should come after unprefixed variants', async () => {
  expect(
    await run(
      ['sm:flex', 'min-sm:max-lg:flex', 'md:flex', 'min-md:max-lg:flex'],
      css`
        @theme {
          /* Explicitly ordered in a strange way */
          --breakpoint-sm: 640px;
          --breakpoint-lg: 1024px;
          --breakpoint-md: 768px;
        }
        @tailwind utilities;
      `,
    ),
  ).toMatchInlineSnapshot(`
    "
    @media (min-width: 640px) {
      .sm\\:flex {
        display: flex;
      }

      @media not all and (min-width: 1024px) {
        .min-sm\\:max-lg\\:flex {
          display: flex;
        }
      }
    }

    @media (min-width: 768px) {
      .md\\:flex {
        display: flex;
      }

      @media not all and (min-width: 1024px) {
        .min-md\\:max-lg\\:flex {
          display: flex;
        }
      }
    }
    "
  `)
})

test('sorting `min` and `max` should sort by unit, then by value, then alphabetically', async () => {
  expect(
    await run([
      'min-[10px]:flex',
      'min-[12px]:flex',
      'min-[10em]:flex',
      'min-[12em]:flex',
      'min-[10rem]:flex',
      'min-[12rem]:flex',
      'max-[10px]:flex',
      'max-[12px]:flex',
      'max-[10em]:flex',
      'max-[12em]:flex',
      'max-[10rem]:flex',
      'max-[12rem]:flex',
      'min-[calc(1000px+12em)]:flex',
      'max-[calc(1000px+12em)]:flex',
      'min-[calc(50vh+12em)]:flex',
      'max-[calc(50vh+12em)]:flex',
      'min-[10vh]:flex',
      'min-[12vh]:flex',
      'max-[10vh]:flex',
      'max-[12vh]:flex',
    ]),
  ).toMatchInlineSnapshot(`
    "
    @media not all and (min-width: calc(1000px + 12em)) {
      .max-\\[calc\\(1000px\\+12em\\)\\]\\:flex {
        display: flex;
      }
    }

    @media not all and (min-width: calc(50vh + 12em)) {
      .max-\\[calc\\(50vh\\+12em\\)\\]\\:flex {
        display: flex;
      }
    }

    @media not all and (min-width: 12em) {
      .max-\\[12em\\]\\:flex {
        display: flex;
      }
    }

    @media not all and (min-width: 10em) {
      .max-\\[10em\\]\\:flex {
        display: flex;
      }
    }

    @media not all and (min-width: 12px) {
      .max-\\[12px\\]\\:flex {
        display: flex;
      }
    }

    @media not all and (min-width: 10px) {
      .max-\\[10px\\]\\:flex {
        display: flex;
      }
    }

    @media not all and (min-width: 12rem) {
      .max-\\[12rem\\]\\:flex {
        display: flex;
      }
    }

    @media not all and (min-width: 10rem) {
      .max-\\[10rem\\]\\:flex {
        display: flex;
      }
    }

    @media not all and (min-width: 12vh) {
      .max-\\[12vh\\]\\:flex {
        display: flex;
      }
    }

    @media not all and (min-width: 10vh) {
      .max-\\[10vh\\]\\:flex {
        display: flex;
      }
    }

    @media (min-width: calc(1000px + 12em)) {
      .min-\\[calc\\(1000px\\+12em\\)\\]\\:flex {
        display: flex;
      }
    }

    @media (min-width: calc(50vh + 12em)) {
      .min-\\[calc\\(50vh\\+12em\\)\\]\\:flex {
        display: flex;
      }
    }

    @media (min-width: 10em) {
      .min-\\[10em\\]\\:flex {
        display: flex;
      }
    }

    @media (min-width: 12em) {
      .min-\\[12em\\]\\:flex {
        display: flex;
      }
    }

    @media (min-width: 10px) {
      .min-\\[10px\\]\\:flex {
        display: flex;
      }
    }

    @media (min-width: 12px) {
      .min-\\[12px\\]\\:flex {
        display: flex;
      }
    }

    @media (min-width: 10rem) {
      .min-\\[10rem\\]\\:flex {
        display: flex;
      }
    }

    @media (min-width: 12rem) {
      .min-\\[12rem\\]\\:flex {
        display: flex;
      }
    }

    @media (min-width: 10vh) {
      .min-\\[10vh\\]\\:flex {
        display: flex;
      }
    }

    @media (min-width: 12vh) {
      .min-\\[12vh\\]\\:flex {
        display: flex;
      }
    }
    "
  `)
})

test('in', async () => {
  expect(
    await run([
      'in-[p]:flex',
      'in-[.group]:flex',
      'not-in-[p]:flex',
      'not-in-[.group]:flex',
      'in-data-visible:flex',
    ]),
  ).toMatchInlineSnapshot(`
    "
    .not-in-\\[\\.group\\]\\:flex:not(:where(.group) *), .not-in-\\[p\\]\\:flex:not(:where(:is(p)) *), :where([data-visible]) .in-data-visible\\:flex, :where(.group) .in-\\[\\.group\\]\\:flex, :where(:is(p)) .in-\\[p\\]\\:flex {
      display: flex;
    }
    "
  `)
  expect(await run(['in-p:flex', 'in-foo-bar:flex'])).toEqual('')
})

test('contrast-more', async () => {
  expect(await run(['contrast-more:flex'])).toMatchInlineSnapshot(`
    "
    @media (prefers-contrast: more) {
      .contrast-more\\:flex {
        display: flex;
      }
    }
    "
  `)
  expect(await run(['contrast-more/foo:flex'])).toEqual('')
})

test('contrast-less', async () => {
  expect(await run(['contrast-less:flex'])).toMatchInlineSnapshot(`
    "
    @media (prefers-contrast: less) {
      .contrast-less\\:flex {
        display: flex;
      }
    }
    "
  `)
  expect(await run(['contrast-less/foo:flex'])).toEqual('')
})

test('forced-colors', async () => {
  expect(await run(['forced-colors:flex'])).toMatchInlineSnapshot(`
    "
    @media (forced-colors: active) {
      .forced-colors\\:flex {
        display: flex;
      }
    }
    "
  `)
  expect(await run(['forced-colors/foo:flex'])).toEqual('')
})

test('inverted-colors', async () => {
  expect(await run(['inverted-colors:flex'])).toMatchInlineSnapshot(`
    "
    @media (inverted-colors: inverted) {
      .inverted-colors\\:flex {
        display: flex;
      }
    }
    "
  `)
})

test('pointer-none', async () => {
  expect(await run(['pointer-none:flex'])).toMatchInlineSnapshot(`
    "
    @media (pointer: none) {
      .pointer-none\\:flex {
        display: flex;
      }
    }
    "
  `)
})

test('pointer-coarse', async () => {
  expect(await run(['pointer-coarse:flex'])).toMatchInlineSnapshot(`
    "
    @media (pointer: coarse) {
      .pointer-coarse\\:flex {
        display: flex;
      }
    }
    "
  `)
})

test('pointer-fine', async () => {
  expect(await run(['pointer-fine:flex'])).toMatchInlineSnapshot(`
    "
    @media (pointer: fine) {
      .pointer-fine\\:flex {
        display: flex;
      }
    }
    "
  `)
})

test('any-pointer-none', async () => {
  expect(await run(['any-pointer-none:flex'])).toMatchInlineSnapshot(`
    "
    @media (any-pointer: none) {
      .any-pointer-none\\:flex {
        display: flex;
      }
    }
    "
  `)
})

test('any-pointer-coarse', async () => {
  expect(await run(['any-pointer-coarse:flex'])).toMatchInlineSnapshot(`
    "
    @media (any-pointer: coarse) {
      .any-pointer-coarse\\:flex {
        display: flex;
      }
    }
    "
  `)
})

test('any-pointer-fine', async () => {
  expect(await run(['any-pointer-fine:flex'])).toMatchInlineSnapshot(`
    "
    @media (any-pointer: fine) {
      .any-pointer-fine\\:flex {
        display: flex;
      }
    }
    "
  `)
})

test('scripting-none', async () => {
  expect(await run(['noscript:flex'])).toMatchInlineSnapshot(`
    "
    @media (scripting: none) {
      .noscript\\:flex {
        display: flex;
      }
    }
    "
  `)
})

test('nth', async () => {
  expect(
    await run([
      'nth-3:flex',
      'nth-[2n+1]:flex',
      'nth-[2n+1_of_.foo]:flex',
      'nth-last-3:flex',
      'nth-last-[2n+1]:flex',
      'nth-last-[2n+1_of_.foo]:flex',
      'nth-of-type-3:flex',
      'nth-of-type-[2n+1]:flex',
      'nth-last-of-type-3:flex',
      'nth-last-of-type-[2n+1]:flex',
    ]),
  ).toMatchInlineSnapshot(`
    "
    .nth-3\\:flex:nth-child(3), .nth-\\[2n\\+1\\]\\:flex:nth-child(odd), .nth-\\[2n\\+1_of_\\.foo\\]\\:flex:nth-child(odd of .foo), .nth-last-3\\:flex:nth-last-child(3), .nth-last-\\[2n\\+1\\]\\:flex:nth-last-child(odd), .nth-last-\\[2n\\+1_of_\\.foo\\]\\:flex:nth-last-child(odd of .foo), .nth-of-type-3\\:flex:nth-of-type(3), .nth-of-type-\\[2n\\+1\\]\\:flex:nth-of-type(odd), .nth-last-of-type-3\\:flex:nth-last-of-type(3), .nth-last-of-type-\\[2n\\+1\\]\\:flex:nth-last-of-type(odd) {
      display: flex;
    }
    "
  `)

  expect(
    await run([
      'nth-foo:flex',
      'nth-of-type-foo:flex',
      'nth-last-foo:flex',
      'nth-last-of-type-foo:flex',
    ]),
  ).toEqual('')
  expect(
    await run([
      'nth--3:flex',
      'nth-3/foo:flex',
      'nth-[2n+1]/foo:flex',
      'nth-[2n+1_of_.foo]/foo:flex',
      'nth-last--3:flex',
      'nth-last-3/foo:flex',
      'nth-last-[2n+1]/foo:flex',
      'nth-last-[2n+1_of_.foo]/foo:flex',
      'nth-of-type--3:flex',
      'nth-of-type-3/foo:flex',
      'nth-of-type-[2n+1]/foo:flex',
      'nth-last-of-type--3:flex',
      'nth-last-of-type-3/foo:flex',
      'nth-last-of-type-[2n+1]/foo:flex',
    ]),
  ).toEqual('')
})

test('container queries', async () => {
  let input = css`
    @theme {
      --container-lg: 1024px;
      --container-foo-bar: 1440px;
    }
    @tailwind utilities;
  `

  expect(
    await run(
      [
        '@lg:flex',
        '@lg/name:flex',
        '@[123px]:flex',
        '@[456px]/name:flex',
        '@foo-bar:flex',
        '@foo-bar/name:flex',

        '@min-lg:flex',
        '@min-lg/name:flex',
        '@min-[123px]:flex',
        '@min-[456px]/name:flex',
        '@min-foo-bar:flex',
        '@min-foo-bar/name:flex',

        '@max-lg:flex',
        '@max-lg/name:flex',
        '@max-[123px]:flex',
        '@max-[456px]/name:flex',
        '@max-foo-bar:flex',
        '@max-foo-bar/name:flex',
      ],
      input,
    ),
  ).toMatchInlineSnapshot(`
    "
    @container name not (min-width: 1440px) {
      .\\@max-foo-bar\\/name\\:flex {
        display: flex;
      }
    }

    @container not (min-width: 1440px) {
      .\\@max-foo-bar\\:flex {
        display: flex;
      }
    }

    @container name not (min-width: 1024px) {
      .\\@max-lg\\/name\\:flex {
        display: flex;
      }
    }

    @container not (min-width: 1024px) {
      .\\@max-lg\\:flex {
        display: flex;
      }
    }

    @container name not (min-width: 456px) {
      .\\@max-\\[456px\\]\\/name\\:flex {
        display: flex;
      }
    }

    @container not (min-width: 123px) {
      .\\@max-\\[123px\\]\\:flex {
        display: flex;
      }
    }

    @container (min-width: 123px) {
      .\\@\\[123px\\]\\:flex, .\\@min-\\[123px\\]\\:flex {
        display: flex;
      }
    }

    @container name (min-width: 456px) {
      .\\@\\[456px\\]\\/name\\:flex, .\\@min-\\[456px\\]\\/name\\:flex {
        display: flex;
      }
    }

    @container name (min-width: 1024px) {
      .\\@lg\\/name\\:flex {
        display: flex;
      }
    }

    @container (min-width: 1024px) {
      .\\@lg\\:flex {
        display: flex;
      }
    }

    @container name (min-width: 1024px) {
      .\\@min-lg\\/name\\:flex {
        display: flex;
      }
    }

    @container (min-width: 1024px) {
      .\\@min-lg\\:flex {
        display: flex;
      }
    }

    @container name (min-width: 1440px) {
      .\\@foo-bar\\/name\\:flex {
        display: flex;
      }
    }

    @container (min-width: 1440px) {
      .\\@foo-bar\\:flex {
        display: flex;
      }
    }

    @container name (min-width: 1440px) {
      .\\@min-foo-bar\\/name\\:flex {
        display: flex;
      }
    }

    @container (min-width: 1440px) {
      .\\@min-foo-bar\\:flex {
        display: flex;
      }
    }
    "
  `)
  expect(
    await run(
      [
        '@-lg:flex',
        '@-lg/name:flex',
        '@-[123px]:flex',
        '@-[456px]/name:flex',
        '@-foo-bar:flex',
        '@-foo-bar/name:flex',

        '@-min-lg:flex',
        '@-min-lg/name:flex',
        '@-min-[123px]:flex',
        '@-min-[456px]/name:flex',
        '@-min-foo-bar:flex',
        '@-min-foo-bar/name:flex',

        '@-max-lg:flex',
        '@-max-lg/name:flex',
        '@-max-[123px]:flex',
        '@-max-[456px]/name:flex',
        '@-max-foo-bar:flex',
        '@-max-foo-bar/name:flex',
      ],
      input,
    ),
  ).toEqual('')
})

