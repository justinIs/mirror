import { Hono } from "hono";
import { AccessToken } from "livekit-server-sdk";
import type { TokenRequest, TokenResponse } from "@mirror/shared";

const API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";
const IDENTITY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const tokenRoute = new Hono();

tokenRoute.post("/token", async (c) => {
  let body: TokenRequest;
  try {
    body = await c.req.json<TokenRequest>();
  } catch {
    return c.json({ error: "invalid JSON body" }, 400);
  }
  if (
    typeof body.room !== "string" ||
    typeof body.identity !== "string" ||
    !IDENTITY_PATTERN.test(body.room) ||
    !IDENTITY_PATTERN.test(body.identity)
  ) {
    return c.json(
      { error: "room and identity must be 1-64 alphanumeric/dash/underscore characters" },
      400,
    );
  }
  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: body.identity,
    ttl: "6h",
  });
  at.addGrant({
    room: body.room,
    roomJoin: true,
    canPublish: body.canPublish ?? true,
    canSubscribe: true,
  });
  return c.json<TokenResponse>({ token: await at.toJwt() });
});
