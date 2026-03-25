import { app } from "./routes.ts";

const port = parseInt(Deno.env.get("PORT") ?? "8000", 10);

Deno.serve({ port }, app.fetch);
