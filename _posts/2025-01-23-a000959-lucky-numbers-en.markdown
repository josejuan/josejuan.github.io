---
layout: post
title: A000959 Lucky Numbers (english version)
author: josejuan
categories: algorithms
---

It has been more than seven years since we solved a beautiful problem, <a href="/algorithms/2017/01/05/zipped-finger-tree.html">enumerating lucky numbers</a>. This series corresponds to the entry <a href="https://oeis.org/A000959">A000959</a> in the numerical series database <a href="https://oeis.org">OEIS</a>. I hadn't realized that, at least among those listed there, ours is by far the fastest implementation for generating them. So we will revisit the algorithm and suggest an entry in **OEIS**.

## Lucky Numbers and Accumulated Cycles

Generating lucky numbers consists of, starting from a certain number, making skips while discarding numbers. You start with all natural numbers, from position 1 with skips of 2.

```text
V
1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 ...
  *   *   *   *    *     *     *     *
```

This is the same as saying we start at 1 and skip according to the cyclic set `{2}`. After jumping from 1 using those cyclic skips, we get:

```text
  V
1 3 5 7 9 11 13 15 17 ...
```

And we will skip every 3, meaning *the last time we skipped 2 we actually skipped 2+3*, resulting in:

```text
  V
1 3 5 7 9 11 13 15 17 ...
    *      *        *
```

But if we look closely, it means that for every three groups of 2, we skip another number. That is, the cycle is `{2, 4}`. Why?

The previous cycle was `{2}`, which has a size of 1. Since every 3 there is another number to eliminate, we must repeat the cycle 3 times, resulting in `{2, 2, 2}`. However, that third number must be eliminated, leaving the cycle as `{2, 4}`.

In other words, we start with `i = 1` (the index of the lucky number, with `i = 1, 2, 3, 4, ...`), initially `n{1} = 1` and `C{2} = {2}`, so the next lucky number is `n{i} = n{i-1} + C{i-1}{i-1}`, in this case `n{2} = n{1} + C{1}{1} = 1 + 2 = 3`.

To calculate `C{i}`, we need to expand `n{i}` times `C{i-1}` and merge the skips at every `n{i}`.

For `i = 2`, `C{2} = {2, 4}` as we have seen.

Then, for `i = 3`, `n{i} = n{i-1} + C{i-1}{i-1} = n{2} + C{2}{2} = 3 + 4 = 7`. Thus:

```text
C{3} = {2, 4, 2, 4, 2, 4 +2, 4, 2, 4, 2, 4, 2 +4}
        1  2  3  4  5  6  7  8  9  10 11 12 13 14
                          ^                    ^

C{3} = {2, 4, 2, 4, 2, 6, 4, 2, 4, 2, 4, 6}
```

For `i = 4`, `n{4} = 7 + 2 = 9`, etc.

## Generating the Next Lucky Number

Given a cycle `C = {2, 4, 2, ... }`, the `i-th` lucky number consists of adding 1 from the left `i` times.

## Updating the Cycle of Increments

Given a cycle `C` and the next lucky number `n`, we must repeat `C` `n` times and merge the increments at multiples of `n` with their predecessors (as we did in the earlier examples).

However, it can be optimized. For example, `C{3}` has a size of 12, and `n{4} = 9`, so in theory the next size `C{4}` should be `12 * 9 = 108`. But since `LCM(12, 9)` is 36, this means the same cycle repeats 3 times. Therefore, instead of expanding to 108, it suffices to do so up to 36.

## Optimization in Haskell or Okasaki Structures

In addition to optimizing the cycle length, in Haskell or any Okasaki structure, the expansions of an increment list cloned multiple times will not take up additional memory.

## Finger Tree

When we have a cycle `C`, we must efficiently reach the `i-th` position. If the skips in `C` are the "fingers" and the intermediate nodes are the accumulated values, representing `C` as a finger tree seems appropriate.

## Zipper

When we need to update `C` by traversing it to merge increments at certain positions, we must act on "nearby" positions without having to rebuild the entire tree from the fingers (positions we merge) to the root. An efficient way to do this is to use a zipper tree.

## Limiting Expansion

It is not always necessary to fully expand cycle `C`. With it, we can generate numbers, provided the increment should not be merged. For `C{i-1}`, this occurs at position `i-2` (i.e., increments in `C{i-1}` above position `n{i}-2` might need adjustment).

For example, `C{3}` has a size of 12, but `n{4}=9`, so we can only generate, with `C{3}`, another `n{4}-2 = 9-2 = 7` lucky numbers.

Conversely, if we want to generate lucky numbers up to `K`, we must expand until `n{i} - 2 >= K`.

## Efficiency Comparison

O(n^2)     David W. Wilson https://oeis.org/A000959/a000959.txt
O(n log n) Using Zipped Finger Tree

```text
 n-th  lucky-n  O(n^2)   O(n log n)
71918  999987    0.821     1.281
136412 1999983   2.678     3.204
198665 2999967   5.420     5.553
259469 3999999   9.035     7.925
319305 4999995  13.647     9.980
378356 5999979  19.086    13.268
436814 6999999  25.241    15.520
494718 8000001  32.152    17.909
552174 8999997  39.748    20.686
609237 9999997  48.110    23.351
```
