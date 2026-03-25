import type { AnalysisResult, PrDetail } from "../core/types.ts";

/** Format individual PR lines */
function formatPrLine(pr: PrDetail): string {
  if (pr.businessHours !== null) {
    return (
      `#${pr.number} by ${pr.author}: ` +
      `${pr.businessHours.toFixed(2)} hours ` +
      `(opened ${pr.createdAt}, first approved ${pr.firstApprovedAt})`
    );
  }
  return `#${pr.number} by ${pr.author}: no approval yet`;
}

/** Render the percentile table */
function formatPercentileTable(result: AnalysisResult): string {
  const lines: string[] = [];
  const pctLabel = "Percentile";
  const hrsLabel = "Hours";
  const header = `${pctLabel.padEnd(12)} ${hrsLabel.padStart(10)}`;
  lines.push(header);
  lines.push("-".repeat(header.length));

  for (const entry of result.overallPercentiles) {
    const tag = `p${entry.percentile}`;
    lines.push(`${tag.padEnd(12)} ${entry.hours.toFixed(2).padStart(10)}`);
  }

  return lines.join("\n");
}

/** Render the ASCII percentile distribution chart (log scale) */
function formatChart(result: AnalysisResult): string {
  if (result.chartData.length === 0) return "";

  const chartHeight = 20;
  const logVals = result.chartData.map((p) => Math.log1p(p.hours));
  const maxLog = Math.max(...logVals) || 1;

  const scaled = logVals.map((lv) =>
    Math.floor((lv / maxLog) * chartHeight)
  );

  const lines: string[] = [];
  lines.push("Percentile distribution (p0-p100, log scale)");
  lines.push("");

  for (let row = chartHeight; row > 0; row--) {
    const hrsAtRow = Math.expm1((row / chartHeight) * maxLog);
    const label = `${hrsAtRow.toFixed(1).padStart(7)}h`;
    let line = "";
    for (const colVal of scaled) {
      line += colVal >= row ? "  \u2588  " : "     ";
    }
    lines.push(`${label} |${line}`);
  }

  lines.push("         +" + "-----".repeat(result.chartData.length));
  let labels = "";
  for (const point of result.chartData) {
    const tag = `p${point.percentile}`;
    labels += tag.padStart(5);
  }
  lines.push(`         ${labels}`);

  return lines.join("\n");
}

/** Render author breakdown table */
function formatAuthorTable(result: AnalysisResult): string {
  if (result.authorBreakdowns.length === 0) return "";

  const lines: string[] = [];
  const header =
    `${"Author".padEnd(25)} ${"PRs".padStart(4)} ${"Avg".padStart(8)} ${"p10".padStart(8)} ${"p25".padStart(8)} ${"p50".padStart(8)} ${"p75".padStart(8)} ${"p90".padStart(8)}`;
  lines.push(header);
  lines.push("-".repeat(header.length));

  for (const breakdown of result.authorBreakdowns) {
    const pMap = new Map(
      breakdown.percentiles.map((p) => [p.percentile, p.hours]),
    );
    lines.push(
      `${breakdown.author.padEnd(25)} ${String(breakdown.prCount).padStart(4)} ${breakdown.avgHours.toFixed(2).padStart(8)} ${(pMap.get(10) ?? 0).toFixed(2).padStart(8)} ${(pMap.get(25) ?? 0).toFixed(2).padStart(8)} ${(pMap.get(50) ?? 0).toFixed(2).padStart(8)} ${(pMap.get(75) ?? 0).toFixed(2).padStart(8)} ${(pMap.get(90) ?? 0).toFixed(2).padStart(8)}`,
    );
  }

  return lines.join("\n");
}

/** Format the complete analysis result for stdout */
export function formatResult(result: AnalysisResult): string {
  const lines: string[] = [];

  for (const pr of result.prs) {
    lines.push(formatPrLine(pr));
  }

  lines.push("");
  lines.push(`PRs considered: ${result.prsConsidered}`);
  lines.push(`PRs with approval: ${result.prsWithApproval}`);

  if (result.avgHoursToFirstApproval !== null) {
    lines.push(
      `Average time to first approval: ${result.avgHoursToFirstApproval.toFixed(2)} hours (business hours, excl. weekends)`,
    );
    lines.push("");
    lines.push(formatPercentileTable(result));
    lines.push("");
    lines.push(formatChart(result));
  } else {
    lines.push("Average time to first approval: n/a");
  }

  const authorTable = formatAuthorTable(result);
  if (authorTable) {
    lines.push("");
    lines.push(authorTable);
  }

  return lines.join("\n");
}
