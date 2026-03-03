export type PopupToSW =
  | { type: "START_CAPTURE"; room: string; identity: string }
  | { type: "STOP_CAPTURE" }
  | { type: "GET_STATUS" };

export type SWToOffscreen =
  | {
      type: "START_CAPTURE";
      room: string;
      identity: string;
      sfuUrl: string;
      token: string;
    }
  | { type: "STOP_CAPTURE" };

export type OffscreenToSW =
  | { type: "CAPTURE_STARTED"; room: string }
  | { type: "CAPTURE_STOPPED" }
  | { type: "CAPTURE_ERROR"; error: string };

export interface CaptureStatus {
  active: boolean;
  room?: string;
  identity?: string;
}
