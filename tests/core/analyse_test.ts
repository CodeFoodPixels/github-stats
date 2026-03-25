import { assertEquals, assertAlmostEquals } from "jsr:@std/assert";
import { analyse } from "../../src/core/analyse.ts";
import type { PullRequest, AnalysisQuery } from "../../src/core/types.ts";

const query: AnalysisQuery = {
  owner: "test-org",
  repo: "test-repo",
  since: "2026-02-18",
};

function makePr(
  overrides: Partial<PullRequest> & { number: number },
): PullRequest {
  return {
    title: `PR #${overrides.number}`,
    author: "alice",
    createdAt: new Date("2026-03-16T09:00:00Z"),
    firstApprovedAt: new Date("2026-03-16T17:00:00Z"),
    ...overrides,
  };
}

Deno.test("empty PR list", () => {
  const result = analyse(query, []);
  assertEquals(result.prsConsidered, 0);
  assertEquals(result.prsWithApproval, 0);
  assertEquals(result.meanHoursToFirstApproval, null);
  assertEquals(result.medianHoursToFirstApproval, null);
  assertEquals(result.overallPercentiles, []);
  assertEquals(result.chartData, []);
  assertEquals(result.authorBreakdowns, []);
});

Deno.test("single PR with approval", () => {
  const prs = [
    makePr({
      number: 1,
      createdAt: new Date("2026-03-16T09:00:00Z"), // Monday
      firstApprovedAt: new Date("2026-03-16T17:00:00Z"), // 8 biz hours later
    }),
  ];
  const result = analyse(query, prs);
  assertEquals(result.prsConsidered, 1);
  assertEquals(result.prsWithApproval, 1);
  assertAlmostEquals(result.meanHoursToFirstApproval!, 8, 0.001);
  assertAlmostEquals(result.medianHoursToFirstApproval!, 8, 0.001);
  assertEquals(result.overallPercentiles.length, 5);
  assertEquals(result.chartData.length, 21);
});

Deno.test("PR without approval counted but excluded from stats", () => {
  const prs = [
    makePr({ number: 1, firstApprovedAt: null }),
    makePr({
      number: 2,
      createdAt: new Date("2026-03-16T09:00:00Z"),
      firstApprovedAt: new Date("2026-03-16T17:00:00Z"),
    }),
  ];
  const result = analyse(query, prs);
  assertEquals(result.prsConsidered, 2);
  assertEquals(result.prsWithApproval, 1);
  assertEquals(result.prs[0].businessHours, null);
  assertAlmostEquals(result.prs[1].businessHours!, 8, 0.001);
});

Deno.test("author breakdowns sorted by avg hours ascending", () => {
  const prs = [
    makePr({
      number: 1,
      author: "bob",
      createdAt: new Date("2026-03-16T00:00:00Z"),
      firstApprovedAt: new Date("2026-03-17T00:00:00Z"), // 24h
    }),
    makePr({
      number: 2,
      author: "alice",
      createdAt: new Date("2026-03-16T09:00:00Z"),
      firstApprovedAt: new Date("2026-03-16T17:00:00Z"), // 8h
    }),
  ];
  const result = analyse(query, prs);
  assertEquals(result.authorBreakdowns.length, 2);
  assertEquals(result.authorBreakdowns[0].author, "alice");
  assertEquals(result.authorBreakdowns[1].author, "bob");
  assertAlmostEquals(result.authorBreakdowns[0].avgHours, 8, 0.001);
  assertAlmostEquals(result.authorBreakdowns[1].avgHours, 24, 0.001);
});

Deno.test("query is passed through to result", () => {
  const customQuery: AnalysisQuery = {
    owner: "my-org",
    repo: "my-repo",
    since: "2026-01-01",
    authors: ["alice"],
  };
  const result = analyse(customQuery, []);
  assertEquals(result.query, customQuery);
});

Deno.test("multiple PRs from same author aggregated", () => {
  const prs = [
    makePr({
      number: 1,
      author: "alice",
      createdAt: new Date("2026-03-16T09:00:00Z"),
      firstApprovedAt: new Date("2026-03-16T17:00:00Z"), // 8h
    }),
    makePr({
      number: 2,
      author: "alice",
      createdAt: new Date("2026-03-17T09:00:00Z"),
      firstApprovedAt: new Date("2026-03-17T13:00:00Z"), // 4h
    }),
  ];
  const result = analyse(query, prs);
  assertEquals(result.authorBreakdowns.length, 1);
  assertEquals(result.authorBreakdowns[0].prCount, 2);
  assertAlmostEquals(result.authorBreakdowns[0].avgHours, 6, 0.001);
});
