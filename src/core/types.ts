/** Query parameters for PR analysis */
export interface AnalysisQuery {
  owner: string;
  repo: string;
  since: string;
  authors?: string[];
}

/** A pull request with its first approval timestamp */
export interface PullRequest {
  number: number;
  title: string;
  author: string;
  createdAt: Date;
  firstApprovedAt: Date | null;
}

/** Individual PR detail within an analysis result */
export interface PrDetail {
  number: number;
  title: string;
  author: string;
  createdAt: string;
  firstApprovedAt: string | null;
  businessHours: number | null;
}

/** A single percentile entry (e.g. p50 = 12.5 hours) */
export interface PercentileEntry {
  percentile: number;
  hours: number;
}

/** A point on the percentile distribution chart */
export interface ChartPoint {
  percentile: number;
  hours: number;
}

/** Per-author breakdown of approval times */
export interface AuthorBreakdown {
  author: string;
  prCount: number;
  avgHours: number;
  percentiles: PercentileEntry[];
}

/** Complete analysis result consumed by both CLI and web */
export interface AnalysisResult {
  query: AnalysisQuery;
  prs: PrDetail[];
  prsConsidered: number;
  prsWithApproval: number;
  avgHoursToFirstApproval: number | null;
  overallPercentiles: PercentileEntry[];
  chartData: ChartPoint[];
  authorBreakdowns: AuthorBreakdown[];
}
