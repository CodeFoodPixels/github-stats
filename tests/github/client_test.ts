import { assertEquals } from "jsr:@std/assert";
import { assertRejects } from "jsr:@std/assert";
import { fetchPullRequests } from "../../src/github/client.ts";
import type { AnalysisQuery } from "../../src/core/types.ts";

const query: AnalysisQuery = {
  owner: "test-org",
  repo: "test-repo",
  since: "2026-02-18",
};

function makeGraphQLResponse(
  nodes: unknown[],
  hasNextPage = false,
  endCursor: string | null = null,
) {
  return {
    data: {
      search: {
        pageInfo: { hasNextPage, endCursor },
        nodes,
      },
    },
  };
}

function makeMockFetch(responses: unknown[]) {
  let callIndex = 0;
  return (() => {
    const body = responses[callIndex++];
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
    });
  }) as unknown as typeof fetch;
}

const sampleNode = {
  number: 42,
  title: "Add feature",
  createdAt: "2026-03-16T09:00:00Z",
  author: { login: "alice", __typename: "User" },
  reviews: { nodes: [{ submittedAt: "2026-03-16T17:00:00Z" }] },
};

Deno.test("fetches and maps a single PR", async () => {
  const mockFetch = makeMockFetch([
    makeGraphQLResponse([sampleNode]),
  ]);

  const prs = await fetchPullRequests(query, "fake-token", mockFetch);
  assertEquals(prs.length, 1);
  assertEquals(prs[0].number, 42);
  assertEquals(prs[0].author, "alice");
  assertEquals(prs[0].title, "Add feature");
  assertEquals(prs[0].createdAt.toISOString(), "2026-03-16T09:00:00.000Z");
  assertEquals(prs[0].firstApprovedAt?.toISOString(), "2026-03-16T17:00:00.000Z");
});

Deno.test("filters out Bot typename", async () => {
  const botNode = {
    ...sampleNode,
    number: 43,
    author: { login: "dependabot", __typename: "Bot" },
  };
  const mockFetch = makeMockFetch([
    makeGraphQLResponse([sampleNode, botNode]),
  ]);

  const prs = await fetchPullRequests(query, "fake-token", mockFetch);
  assertEquals(prs.length, 1);
  assertEquals(prs[0].number, 42);
});

Deno.test("filters out [bot] suffix", async () => {
  const botNode = {
    ...sampleNode,
    number: 44,
    author: { login: "renovate[bot]", __typename: "User" },
  };
  const mockFetch = makeMockFetch([
    makeGraphQLResponse([sampleNode, botNode]),
  ]);

  const prs = await fetchPullRequests(query, "fake-token", mockFetch);
  assertEquals(prs.length, 1);
});

Deno.test("handles pagination", async () => {
  const node1 = { ...sampleNode, number: 1 };
  const node2 = { ...sampleNode, number: 2 };
  const mockFetch = makeMockFetch([
    makeGraphQLResponse([node1], true, "cursor1"),
    makeGraphQLResponse([node2], false),
  ]);

  const prs = await fetchPullRequests(query, "fake-token", mockFetch);
  assertEquals(prs.length, 2);
  assertEquals(prs[0].number, 1);
  assertEquals(prs[1].number, 2);
});

Deno.test("filters by authors when specified", async () => {
  const node1 = { ...sampleNode, number: 1, author: { login: "alice", __typename: "User" } };
  const node2 = { ...sampleNode, number: 2, author: { login: "bob", __typename: "User" } };
  const mockFetch = makeMockFetch([
    makeGraphQLResponse([node1, node2]),
  ]);

  const queryWithAuthors = { ...query, authors: ["alice"] };
  const prs = await fetchPullRequests(queryWithAuthors, "fake-token", mockFetch);
  assertEquals(prs.length, 1);
  assertEquals(prs[0].author, "alice");
});

Deno.test("PR without approval has null firstApprovedAt", async () => {
  const noApprovalNode = {
    ...sampleNode,
    number: 99,
    reviews: { nodes: [] },
  };
  const mockFetch = makeMockFetch([
    makeGraphQLResponse([noApprovalNode]),
  ]);

  const prs = await fetchPullRequests(query, "fake-token", mockFetch);
  assertEquals(prs.length, 1);
  assertEquals(prs[0].firstApprovedAt, null);
});

Deno.test("throws on HTTP error", async () => {
  const mockFetch = (() =>
    Promise.resolve({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    })) as unknown as typeof fetch;

  await assertRejects(
    () => fetchPullRequests(query, "bad-token", mockFetch),
    Error,
    "GitHub API error: 401",
  );
});

Deno.test("throws on GraphQL errors", async () => {
  const mockFetch = (() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { search: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } },
          errors: [{ message: "Something went wrong" }],
        }),
    })) as unknown as typeof fetch;

  await assertRejects(
    () => fetchPullRequests(query, "fake-token", mockFetch),
    Error,
    "GraphQL errors",
  );
});

Deno.test("null author treated as bot", async () => {
  const nullAuthorNode = {
    ...sampleNode,
    number: 50,
    author: null,
  };
  const mockFetch = makeMockFetch([
    makeGraphQLResponse([nullAuthorNode]),
  ]);

  const prs = await fetchPullRequests(query, "fake-token", mockFetch);
  assertEquals(prs.length, 0);
});
