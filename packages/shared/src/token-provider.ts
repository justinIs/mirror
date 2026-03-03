import type { TokenRequest, TokenResponse } from "./types";

export class HttpTokenProvider {
  constructor(private baseUrl: string) {}

  async getToken(req: TokenRequest): Promise<string> {
    const resp = await fetch(`${this.baseUrl}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!resp.ok) throw new Error(`Token request failed: ${resp.status}`);
    const data: TokenResponse = await resp.json();
    return data.token;
  }
}
