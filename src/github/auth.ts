/**
 * Resolve a GitHub token.
 * 1. Try `gh auth token` subprocess
 * 2. Fall back to GITHUB_TOKEN env var
 */
export async function resolveToken(): Promise<string> {
  try {
    const command = new Deno.Command("gh", { args: ["auth", "token"], stdout: "piped", stderr: "piped" });
    const { code, stdout } = await command.output();
    if (code === 0) {
      const token = new TextDecoder().decode(stdout).trim();
      if (token) return token;
    }
  } catch {
    // gh CLI not available, fall through
  }

  const envToken = Deno.env.get("GITHUB_TOKEN");
  if (envToken) return envToken;

  throw new Error(
    "No GitHub token found. Install `gh` CLI and run `gh auth login`, or set GITHUB_TOKEN.",
  );
}
