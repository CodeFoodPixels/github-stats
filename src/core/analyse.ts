import type {
  PullRequest,
  AnalysisQuery,
  AnalysisResult,
  PrDetail,
  AuthorBreakdown,
} from "./types.ts";
import { businessHours } from "./business_hours.ts";
import { standardPercentiles, chartPercentiles } from "./percentiles.ts";

/** Transform a list of PRs into a complete analysis result. Pure function, no I/O. */
export function analyse(
  query: AnalysisQuery,
  prs: PullRequest[],
): AnalysisResult {
  const details: PrDetail[] = [];
  const durations: number[] = [];
  const perAuthor = new Map<string, number[]>();

  for (const pr of prs) {
    let hours: number | null = null;

    if (pr.firstApprovedAt) {
      hours = businessHours(pr.createdAt, pr.firstApprovedAt);
      durations.push(hours);

      const authorDurations = perAuthor.get(pr.author) ?? [];
      authorDurations.push(hours);
      perAuthor.set(pr.author, authorDurations);
    }

    details.push({
      number: pr.number,
      title: pr.title,
      author: pr.author,
      createdAt: pr.createdAt.toISOString(),
      firstApprovedAt: pr.firstApprovedAt?.toISOString() ?? null,
      businessHours: hours,
    });
  }

  const avg =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : null;

  const authorBreakdowns: AuthorBreakdown[] = [...perAuthor.entries()]
    .map(([author, vals]) => ({
      author,
      prCount: vals.length,
      avgHours: vals.reduce((a, b) => a + b, 0) / vals.length,
      percentiles: standardPercentiles(vals),
    }))
    .sort((a, b) => a.avgHours - b.avgHours);

  return {
    query,
    prs: details,
    prsConsidered: prs.length,
    prsWithApproval: durations.length,
    avgHoursToFirstApproval: avg,
    overallPercentiles: standardPercentiles(durations),
    chartData: chartPercentiles(durations),
    authorBreakdowns,
  };
}
