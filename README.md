# github-stats

Your GitHub activity, fully understood. **github-stats** digs into your repositories and surfaces the metrics that actually matter — PR review times, pipeline failures, commit patterns, and so much more. Think of it as your team's engineering health dashboard.

Run it from the terminal or spin up the web dashboard. Your call!

## Prerequisites

This runs locally only — it talks directly to GitHub through your CLI session.

1. Install [Deno](https://deno.land/) (v2+)
2. Install the [GitHub CLI](https://cli.github.com/)
3. Sign in: `gh auth login`
4. Make sure your GitHub CLI has access to any organisations, repos, or accounts you want to analyse — that's configured through the GitHub CLI itself and is outside the scope of this project

## Getting started

Clone the repo and you're good to go — no install step needed.

```sh
git clone <your-repo-url>
cd github-stats
```

## Running it

### Web dashboard (recommended)

The easiest way to get going — spin up the dashboard and explore your stats in the browser.

```sh
deno task web
```

Opens on `http://localhost:8000` by default. Set the `PORT` env var to change it.

### CLI

Prefer the terminal? The CLI has you covered.

```sh
deno task cli --owner <org-or-user> --repo <repo-name>
```

Optional flags:
- `--since 2025-01-01` — start date (defaults to 1 month ago)
- `--authors alice,bob` — filter to specific authors

### Tests

```sh
deno task test
```

### Compile to a standalone binary

```sh
deno task compile
```

Produces a `github-stats` binary you can run anywhere.

## What's next

This project is just getting started! Here's what's on the horizon:

- **More metrics** — review cycle time, merge-to-deploy, PR size trends
- **Team-level dashboards** — compare across repos and squads
- **Historical tracking** — store results over time and spot trends
- **CI integration** — post stats to PRs automatically
- **Richer web UI** — charts, filters, and date range pickers

Got ideas? Open an issue — contributions are very welcome!
