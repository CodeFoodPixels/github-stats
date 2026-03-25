import { parseArgs } from "jsr:@std/cli/parse-args";
import { resolveToken } from "../github/auth.ts";
import { fetchPullRequests } from "../github/client.ts";
import { analyse } from "../core/analyse.ts";
import { formatResult } from "./formatters.ts";
import type { AnalysisQuery } from "../core/types.ts";

function defaultSince(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 10);
}

function printUsage(): void {
  console.log(`Usage: github-stats --owner <owner> --repo <repo> [options]

Options:
  --owner     GitHub org/user (required)
  --repo      Repository name (required)
  --since     ISO date, default: 1 month ago
  --authors   Comma-separated list of authors to include
  --help      Show this help message`);
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    string: ["owner", "repo", "since", "authors"],
    boolean: ["help"],
    default: { since: defaultSince() },
  });

  if (args.help) {
    printUsage();
    Deno.exit(0);
  }

  if (!args.owner || !args.repo) {
    printUsage();
    Deno.exit(1);
  }

  const query: AnalysisQuery = {
    owner: args.owner,
    repo: args.repo,
    since: args.since,
    authors: args.authors ? args.authors.split(",").map((a) => a.trim()) : undefined,
  };

  const token = await resolveToken();
  const prs = await fetchPullRequests(query, token);
  const result = analyse(query, prs);

  console.log(formatResult(result));
}

main();
