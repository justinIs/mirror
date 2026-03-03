export interface TokenRequest {
  room: string;
  identity: string;
  canPublish?: boolean;
}

export interface TokenResponse {
  token: string;
}

export type TrackSource = "screen" | "screen_audio";

export interface TrackInfo {
  trackSid: string;
  source: TrackSource;
}
