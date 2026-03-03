import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { tokenRoute } from "./routes/token.js";

const app = new Hono();
app.use("/*", cors());
app.route("/", tokenRoute);

const port = Number(process.env.PORT) || 7880;
serve({ fetch: app.fetch, port }, () => {
  console.log(`Token server listening on :${port}`);
});
