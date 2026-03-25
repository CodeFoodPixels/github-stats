/** GraphQL query to fetch PRs with their first approval review. */
export const PR_SEARCH_QUERY = `
query($searchQuery: String!, $cursor: String) {
  search(query: $searchQuery, type: ISSUE, first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on PullRequest {
        number
        title
        createdAt
        author { login __typename }
        reviews(states: APPROVED, first: 1) {
          nodes { submittedAt }
        }
      }
    }
  }
}`;
