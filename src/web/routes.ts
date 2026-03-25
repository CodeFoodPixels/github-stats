import { Hono } from "jsr:@hono/hono";
import { serveStatic } from "jsr:@hono/hono/deno";
import { resolveToken } from "../github/auth.ts";
import { fetchPullRequests } from "../github/client.ts";
import { analyse } from "../core/analyse.ts";
import type { AnalysisQuery } from "../core/types.ts";

export const app = new Hono();

app.get("/api/analyse", async (c) => {
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");

  if (!owner || !repo) {
    return c.json({ error: "owner and repo are required" }, 400);
  }

  const since = c.req.query("since") ?? defaultSince();
  const authorsParam = c.req.query("authors");
  const authors = authorsParam
    ? authorsParam.split(",").map((a) => a.trim())
    : undefined;

  const query: AnalysisQuery = { owner, repo, since, authors };

  try {
    const token = await resolveToken();
    const prs = await fetchPullRequests(query, token);
    const result = analyse(query, prs);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

app.use("/*", serveStatic({ root: "./src/web/static" }));

function defaultSince(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 10);
}
