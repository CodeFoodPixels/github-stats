import { assertEquals, assertAlmostEquals } from "jsr:@std/assert";
import {
  percentile,
  standardPercentiles,
  chartPercentiles,
} from "../../src/core/percentiles.ts";

Deno.test("single value returns that value for any percentile", () => {
  assertEquals(percentile([42], 0), 42);
  assertEquals(percentile([42], 50), 42);
  assertEquals(percentile([42], 100), 42);
});

Deno.test("two values interpolate correctly", () => {
  assertEquals(percentile([10, 20], 0), 10);
  assertEquals(percentile([10, 20], 50), 15);
  assertEquals(percentile([10, 20], 100), 20);
});

Deno.test("p50 of [1,2,3,4,5] = 3", () => {
  assertEquals(percentile([1, 2, 3, 4, 5], 50), 3);
});

Deno.test("p25 of [1,2,3,4,5] = 2", () => {
  assertEquals(percentile([1, 2, 3, 4, 5], 25), 2);
});

Deno.test("p75 of [1,2,3,4,5] = 4", () => {
  assertEquals(percentile([1, 2, 3, 4, 5], 75), 4);
});

Deno.test("handles unsorted input", () => {
  assertEquals(percentile([5, 1, 3, 2, 4], 50), 3);
});

Deno.test("linear interpolation between values", () => {
  // [10, 20, 30, 40] at p30:
  // k = 3 * 0.3 = 0.9, f=0, c=1
  // result = 10 + 0.9 * (20 - 10) = 19
  assertAlmostEquals(percentile([10, 20, 30, 40], 30), 19, 0.001);
});

Deno.test("standardPercentiles returns 5 entries", () => {
  const result = standardPercentiles([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assertEquals(result.length, 5);
  assertEquals(result.map((e) => e.percentile), [10, 25, 50, 75, 90]);
});

Deno.test("standardPercentiles empty array returns empty", () => {
  assertEquals(standardPercentiles([]), []);
});

Deno.test("chartPercentiles returns 21 points (0 to 100 step 5)", () => {
  const result = chartPercentiles([1, 2, 3, 4, 5]);
  assertEquals(result.length, 21);
  assertEquals(result[0].percentile, 0);
  assertEquals(result[20].percentile, 100);
});

Deno.test("chartPercentiles empty array returns empty", () => {
  assertEquals(chartPercentiles([]), []);
});
