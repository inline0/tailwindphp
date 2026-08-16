<?php

declare(strict_types=1);

namespace TailwindPHP;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

use function TailwindPHP\SelectorParser\parse;
use function TailwindPHP\SelectorParser\toCss;
use function TailwindPHP\Walk\walk;

use TailwindPHP\Walk\WalkAction;

/**
 * Port of: packages/tailwindcss/src/selector-parser.test.ts
 */
class selector_parser extends TestCase
{
    // describe('parse')

    #[Test]
    public function should_parse_a_simple_selector(): void
    {
        $this->assertSame([['kind' => 'selector', 'value' => '.foo']], parse('.foo'));
    }

    #[Test]
    public function should_parse_a_compound_selector(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'selector', 'value' => '.bar'],
                    ['kind' => 'selector', 'value' => ':hover'],
                    ['kind' => 'selector', 'value' => '#id'],
                ],
            ],
        ], parse('.foo.bar:hover#id'));
    }

    #[Test]
    public function should_parse_a_pseudo_element_selector_with_double_colons(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'selector', 'value' => '::before'],
                ],
            ],
        ], parse('.foo::before'));
    }

    #[Test]
    public function should_parse_a_selector_list(): void
    {
        $this->assertSame([
            [
                'kind' => 'list',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'selector', 'value' => '.bar'],
                ],
            ],
        ], parse('.foo,.bar'));
    }

    // We've got 3 options here:
    //
    // 1. We could throw, but then it becomes more annoying when you don't have
    //    control over the CSS (for example when it's coming from a package).
    // 2. We could parse it and ignore the invalid cases as-if they weren't there.
    //    Re-printing the AST would turn it into a valid situation.
    // 3. We could parse the invalid case and turn it into a `compound` such that
    //    it stays invalid. When we re-print we would re-introduce the error.
    //
    // Before this change, we would keep the errors, and pass it along:
    // - In a browser environment, these would be ignored
    // - In Lightning CSS, these are thrown out
    //
    // For that reason alone, let's go with option 3 for now, such that the
    // behavior is the same as before. This does mean that we see "weird" empty
    // compound nodes.
    #[Test]
    public function should_safely_parse_an_invalid_selector_list(): void
    {
        $this->assertSame([
            [
                'kind' => 'list',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'compound', 'nodes' => []],
                ],
            ],
        ], parse('.foo,'));

        $this->assertSame([
            [
                'kind' => 'list',
                'nodes' => [
                    ['kind' => 'compound', 'nodes' => []],
                    ['kind' => 'selector', 'value' => '.foo'],
                ],
            ],
        ], parse(',.foo'));

        $this->assertSame([
            [
                'kind' => 'list',
                'nodes' => [
                    ['kind' => 'compound', 'nodes' => []],
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'compound', 'nodes' => []],
                ],
            ],
        ], parse(',.foo,'));

        $this->assertSame([
            [
                'kind' => 'list',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'compound', 'nodes' => []],
                    ['kind' => 'selector', 'value' => '.bar'],
                ],
            ],
        ], parse('.foo,,.bar'));
    }

    #[Test]
    public function should_parse_selector_lists_with_whitespace_around_the_comma(): void
    {
        $expected = [
            [
                'kind' => 'list',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'selector', 'value' => '.bar'],
                ],
            ],
        ];

        $this->assertSame($expected, parse('.foo, .bar'));
        $this->assertSame($expected, parse('.foo , .bar'));
        $this->assertSame($expected, parse('.foo ,.bar'));
    }

    #[Test]
    public function should_parse_a_list_of_attribute_selectors(): void
    {
        $this->assertSame([
            [
                'kind' => 'list',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '[foo]'],
                    ['kind' => 'selector', 'value' => '[bar]'],
                ],
            ],
        ], parse('[foo],[bar]'));
    }

    #[Test]
    public function should_parse_a_list_of_selectors_with_just_functions(): void
    {
        $this->assertSame([
            [
                'kind' => 'list',
                'nodes' => [
                    ['kind' => 'function', 'value' => ':is', 'nodes' => [['kind' => 'selector', 'value' => '.a']]],
                    ['kind' => 'function', 'value' => ':is', 'nodes' => [['kind' => 'selector', 'value' => '.b']]],
                ],
            ],
        ], parse(':is(.a),:is(.b)'));
    }

    #[Test]
    public function should_parse_selector_lists_with_more_than_two_selectors(): void
    {
        $this->assertSame([
            [
                'kind' => 'list',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'selector', 'value' => '.bar'],
                    ['kind' => 'selector', 'value' => '.baz'],
                ],
            ],
        ], parse('.foo,.bar,.baz'));
    }

    #[Test]
    public function should_group_selectors_with_combinators_in_a_selector_list(): void
    {
        $this->assertSame([
            [
                'kind' => 'list',
                'nodes' => [
                    [
                        'kind' => 'complex',
                        'nodes' => [
                            ['kind' => 'selector', 'value' => '.a'],
                            ['kind' => 'combinator', 'value' => '+'],
                            ['kind' => 'selector', 'value' => '.b'],
                        ],
                    ],
                    [
                        'kind' => 'complex',
                        'nodes' => [
                            ['kind' => 'selector', 'value' => '.c'],
                            ['kind' => 'combinator', 'value' => ' '],
                            [
                                'kind' => 'compound',
                                'nodes' => [
                                    ['kind' => 'selector', 'value' => '.d'],
                                    ['kind' => 'selector', 'value' => '[attr]'],
                                ],
                            ],
                        ],
                    ],
                    ['kind' => 'selector', 'value' => '.e'],
                ],
            ],
        ], parse('.a+.b, .c .d[attr], .e'));
    }

    #[Test]
    public function should_parse_complex_selectors_in_a_selector_list(): void
    {
        $this->assertSame([
            [
                'kind' => 'list',
                'nodes' => [
                    [
                        'kind' => 'complex',
                        'nodes' => [
                            [
                                'kind' => 'compound',
                                'nodes' => [
                                    ['kind' => 'selector', 'value' => '#a'],
                                    ['kind' => 'selector', 'value' => '.b'],
                                ],
                            ],
                            ['kind' => 'combinator', 'value' => '>'],
                            ['kind' => 'selector', 'value' => '.c'],
                        ],
                    ],
                    ['kind' => 'selector', 'value' => '.d'],
                ],
            ],
        ], parse('#a.b > .c, .d'));
    }

    #[Test]
    public function should_combine_everything_within_attribute_selectors(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'selector', 'value' => '[bar="baz"]'],
                ],
            ],
        ], parse('.foo[bar="baz"]'));
    }

    #[Test]
    public function should_parse_functions(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'selector', 'value' => ':hover'],
                    [
                        'kind' => 'function',
                        'value' => ':not',
                        'nodes' => [
                            [
                                'kind' => 'compound',
                                'nodes' => [
                                    ['kind' => 'selector', 'value' => '.bar'],
                                    ['kind' => 'selector', 'value' => ':focus'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ], parse('.foo:hover:not(.bar:focus)'));
    }

    #[Test]
    public function should_parse_selector_lists_in_functions(): void
    {
        $this->assertSame([
            [
                'kind' => 'function',
                'value' => ':is',
                'nodes' => [
                    [
                        'kind' => 'list',
                        'nodes' => [
                            ['kind' => 'selector', 'value' => '.foo'],
                            ['kind' => 'selector', 'value' => '.bar'],
                        ],
                    ],
                ],
            ],
        ], parse(':is(.foo, .bar)'));
    }

    #[Test]
    public function should_handle_next_children_combinator(): void
    {
        $this->assertSame([
            [
                'kind' => 'complex',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'combinator', 'value' => '+'],
                    ['kind' => 'selector', 'value' => 'p'],
                ],
            ],
        ], parse('.foo + p'));
    }

    #[Test]
    public function should_normalize_combinators(): void
    {
        $this->assertSame([
            [
                'kind' => 'complex',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'combinator', 'value' => '+'],
                    ['kind' => 'selector', 'value' => '.bar'],
                ],
            ],
        ], parse('.foo + .bar'));

        $this->assertSame([
            [
                'kind' => 'complex',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '.foo'],
                    ['kind' => 'combinator', 'value' => ' '],
                    ['kind' => 'selector', 'value' => '.bar'],
                ],
            ],
        ], parse(".foo  \n\t .bar"));
    }

    #[Test]
    public function should_handle_escaped_characters(): void
    {
        $this->assertSame([['kind' => 'selector', 'value' => 'foo\\.bar']], parse('foo\\.bar'));
    }

    #[Test]
    public function parses_nth_child(): void
    {
        // The `An+B` part is not a selector, it stays an opaque value
        $this->assertSame([
            [
                'kind' => 'function',
                'value' => ':nth-child',
                'nodes' => [['kind' => 'value', 'value' => 'n+1']],
            ],
        ], parse(':nth-child(n+1)'));

        // The selector list after `of` is parsed as a selector
        $this->assertSame([
            [
                'kind' => 'function',
                'value' => ':nth-child',
                'nodes' => [
                    ['kind' => 'value', 'value' => '2 of '],
                    ['kind' => 'selector', 'value' => '&'],
                ],
            ],
        ], parse(':nth-child(2 of &)'));

        $this->assertSame([
            [
                'kind' => 'function',
                'value' => ':nth-child',
                'nodes' => [
                    ['kind' => 'value', 'value' => '2n + 1 of '],
                    [
                        'kind' => 'list',
                        'nodes' => [
                            ['kind' => 'selector', 'value' => '.foo'],
                            ['kind' => 'selector', 'value' => '.bar'],
                        ],
                    ],
                ],
            ],
        ], parse(':nth-child(2n + 1 of .foo, .bar)'));
    }

    #[Test]
    public function parses_nesting_has_with_child_nth_child(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '&'],
                    [
                        'kind' => 'function',
                        'value' => ':has',
                        'nodes' => [
                            [
                                'kind' => 'compound',
                                'nodes' => [
                                    ['kind' => 'selector', 'value' => '.child'],
                                    [
                                        'kind' => 'function',
                                        'value' => ':nth-child',
                                        'nodes' => [['kind' => 'value', 'value' => '2']],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ], parse('&:has(.child:nth-child(2))'));
    }

    #[Test]
    public function parses_nesting_has_with_nth_child(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '&'],
                    [
                        'kind' => 'function',
                        'value' => ':has',
                        'nodes' => [
                            [
                                'kind' => 'function',
                                'value' => ':nth-child',
                                'nodes' => [['kind' => 'value', 'value' => '2']],
                            ],
                        ],
                    ],
                ],
            ],
        ], parse('&:has(:nth-child(2))'));
    }

    #[Test]
    public function parses_nesting_selector_before_attribute_selector(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '&'],
                    ['kind' => 'selector', 'value' => '[data-foo]'],
                ],
            ],
        ], parse('&[data-foo]'));
    }

    #[Test]
    public function parses_nesting_selector_after_an_attribute_selector(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '[data-foo]'],
                    ['kind' => 'selector', 'value' => '&'],
                ],
            ],
        ], parse('[data-foo]&'));
    }

    #[Test]
    public function parses_universal_selector_before_attribute_selector(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '*'],
                    ['kind' => 'selector', 'value' => '[data-foo]'],
                ],
            ],
        ], parse('*[data-foo]'));
    }

    #[Test]
    public function parses_the_universal_selector_after_an_attribute_selector(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '[data-foo]'],
                    ['kind' => 'selector', 'value' => '*'],
                ],
            ],
        ], parse('[data-foo]*'));
    }

    #[Test]
    public function parses_another_attribute_selector_after_an_attribute_selector(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '[data-foo]'],
                    ['kind' => 'selector', 'value' => '[data-bar]'],
                ],
            ],
        ], parse('[data-foo][data-bar]'));
    }

    #[Test]
    public function parses_a_type_selector_before_an_attribute_selector(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => 'div'],
                    ['kind' => 'selector', 'value' => '[data-foo]'],
                ],
            ],
        ], parse('div[data-foo]'));
    }

    #[Test]
    public function parses_a_type_selector_after_an_attribute_selector(): void
    {
        $this->assertSame([
            [
                'kind' => 'compound',
                'nodes' => [
                    ['kind' => 'selector', 'value' => '[data-foo]'],
                    ['kind' => 'selector', 'value' => 'div'],
                ],
            ],
        ], parse('[data-foo]div'));
    }

    #[Test]
    public function should_parse_selector_lists_as_real_selectors(): void
    {
        $this->assertSame([
            [
                'kind' => 'list',
                'nodes' => [
                    [
                        'kind' => 'compound',
                        'nodes' => [
                            ['kind' => 'selector', 'value' => '.foo'],
                            ['kind' => 'selector', 'value' => '[attr]'],
                        ],
                    ],
                    [
                        'kind' => 'compound',
                        'nodes' => [
                            ['kind' => 'selector', 'value' => '.bar'],
                            ['kind' => 'selector', 'value' => '#id'],
                        ],
                    ],
                    [
                        'kind' => 'complex',
                        'nodes' => [
                            ['kind' => 'selector', 'value' => '.baz'],
                            ['kind' => 'combinator', 'value' => '+'],
                            ['kind' => 'selector', 'value' => '.qux'],
                        ],
                    ],
                ],
            ],
        ], parse('.foo[attr], .bar#id, .baz + .qux'));
    }

    // describe('toCss')

    #[Test]
    public function should_print_a_simple_selector(): void
    {
        $this->assertSame('.foo', toCss(parse('.foo')));
    }

    #[Test]
    public function should_print_a_compound_selector(): void
    {
        $this->assertSame('.foo.bar:hover#id', toCss(parse('.foo.bar:hover#id')));
    }

    #[Test]
    public function should_print_a_selector_list(): void
    {
        $this->assertSame('.foo, .bar', toCss(parse('.foo, .bar')));
    }

    #[Test]
    public function should_print_a_selector_list_with_normalized_commas(): void
    {
        $this->assertSame('.foo, .bar', toCss(parse('.foo,.bar')));
        $this->assertSame('.foo, .bar', toCss(parse('.foo, .bar')));
        $this->assertSame('.foo, .bar', toCss(parse('.foo , .bar')));
        $this->assertSame('.foo, .bar', toCss(parse('.foo ,.bar')));
    }

    #[Test]
    public function should_print_a_selector_list_but_minimized(): void
    {
        $this->assertSame('.foo,.bar', toCss(parse('.foo, .bar'), true));
        $this->assertSame('.foo,.bar', toCss(parse('.foo , .bar'), true));
        $this->assertSame('.foo,.bar', toCss(parse('.foo ,.bar'), true));
    }

    #[Test]
    public function should_print_an_attribute_selectors(): void
    {
        $this->assertSame('.foo[bar="baz"]', toCss(parse('.foo[bar="baz"]')));
    }

    #[Test]
    public function should_print_a_function(): void
    {
        $this->assertSame('.foo:hover:not(.bar:focus)', toCss(parse('.foo:hover:not(.bar:focus)')));
    }

    #[Test]
    public function should_print_escaped_characters(): void
    {
        $this->assertSame('foo\\.bar', toCss(parse('foo\\.bar')));
    }

    #[Test]
    public function should_print_nth_child(): void
    {
        // The `An+B` part is printed verbatim, whitespace in the selector list
        // after `of` is normalized
        $this->assertSame(':nth-child(n+1)', toCss(parse(':nth-child(n+1)')));
        $this->assertSame(':nth-child(+2)', toCss(parse(':nth-child(+2)')));
        $this->assertSame(':nth-child(2n + 1 of .foo, .bar)', toCss(parse(':nth-child(2n + 1 of .foo,.bar)')));
    }

    #[Test]
    public function should_pretty_print_a_complex_selector(): void
    {
        $this->assertSame('.a + .b, .c .d[attr], .e', toCss(parse('.a+.b, .c .d[attr], .e')));
    }

    #[Test]
    public function should_minify_a_complex_selector_during_printing(): void
    {
        $this->assertSame('.a+.b,.c .d[attr],.e', toCss(parse('.a+.b, .c .d[attr], .e'), true));
        //                       ^ This space is significant to indicate a descendant combinator
    }

    // describe('walk')

    #[Test]
    public function can_be_used_to_replace_a_function_call(): void
    {
        $ast = parse('.foo:hover:not(.bar:focus)');
        walk($ast, function ($node) {
            if ($node['kind'] === 'function' && $node['value'] === ':not') {
                return WalkAction::Replace(['kind' => 'selector', 'value' => '.inverted-bar']);
            }
        });
        $this->assertSame('.foo:hover.inverted-bar', toCss($ast));
    }
}
