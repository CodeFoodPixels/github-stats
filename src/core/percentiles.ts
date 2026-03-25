import type { PercentileEntry, ChartPoint } from "./types.ts";

/**
 * Linear interpolation percentile, matching ghpr.sh lines 66–71.
 * Requires a non-empty array.
 */
export function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const k = (sorted.length - 1) * (p / 100);
  const f = Math.floor(k);
  const c = f + 1 < sorted.length ? f + 1 : f;
  return sorted[f] + (k - f) * (sorted[c] - sorted[f]);
}

/** Standard percentile entries: p10, p25, p50, p75, p90 */
export function standardPercentiles(values: number[]): PercentileEntry[] {
  if (values.length === 0) return [];
  return [10, 25, 50, 75, 90].map((p) => ({
    percentile: p,
    hours: percentile(values, p),
  }));
}

/** Chart data: p0–p100 in steps of 5 */
export function chartPercentiles(values: number[]): ChartPoint[] {
  if (values.length === 0) return [];
  const points: ChartPoint[] = [];
  for (let p = 0; p <= 100; p += 5) {
    points.push({ percentile: p, hours: percentile(values, p) });
  }
  return points;
}
