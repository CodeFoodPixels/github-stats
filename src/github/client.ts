import type { PullRequest, AnalysisQuery } from "../core/types.ts";
import { PR_SEARCH_QUERY } from "./queries.ts";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const MAX_PAGES = 10;

interface GraphQLResponse {
  data: {
    search: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: RawPrNode[];
    };
  };
  errors?: Array<{ message: string }>;
}

interface RawPrNode {
  number: number;
  title: string;
  createdAt: string;
  author: { login: string; __typename: string } | null;
  reviews: { nodes: Array<{ submittedAt: string | null }> };
}

/** Filter out bots — matches ghpr.sh lines 89–91 */
function isBot(author: { login: string; __typename: string } | null): boolean {
  if (!author) return true;
  return author.__typename === "Bot" || author.login.endsWith("[bot]");
}

/** Map a raw GraphQL node to our domain type */
function toPullRequest(node: RawPrNode): PullRequest {
  const reviewNodes = node.reviews?.nodes ?? [];
  const firstApproval = reviewNodes[0]?.submittedAt ?? null;

  return {
    number: node.number,
    title: node.title,
    author: node.author?.login ?? "unknown",
    createdAt: new Date(node.createdAt),
    firstApprovedAt: firstApproval ? new Date(firstApproval) : null,
  };
}

/**
 * Fetch all PRs matching the query from GitHub GraphQL API.
 * Handles pagination (up to 10 pages / 1000 PRs) and bot filtering.
 *
 * @param fetchFn - Injectable fetch for testing
 */
export async function fetchPullRequests(
  query: AnalysisQuery,
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<PullRequest[]> {
  const searchQuery = buildSearchQuery(query);
  const prs: PullRequest[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const variables: Record<string, string> = { searchQuery };
    if (cursor) variables.cursor = cursor;

    const response = await fetchFn(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "github-stats",
      },
      body: JSON.stringify({ query: PR_SEARCH_QUERY, variables }),
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    const json: GraphQLResponse = await response.json();

    if (json.errors?.length) {
      throw new Error(`GraphQL errors: ${json.errors.map((e) => e.message).join(", ")}`);
    }

    const { nodes, pageInfo } = json.data.search;

    for (const node of nodes) {
      if (!node.number) continue; // skip non-PR nodes
      if (isBot(node.author)) continue;

      const pr = toPullRequest(node);

      if (query.authors?.length) {
        if (!query.authors.includes(pr.author)) continue;
      }

      prs.push(pr);
    }

    if (!pageInfo.hasNextPage) break;
    cursor = pageInfo.endCursor;
  }

  return prs;
}

function buildSearchQuery(query: AnalysisQuery): string {
  return `repo:${query.owner}/${query.repo} is:pr created:>=${query.since}`;
}
