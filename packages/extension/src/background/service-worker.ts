import { HttpTokenProvider } from "@mirror/shared";
import type {
  PopupToSW,
  OffscreenToSW,
  SWToOffscreen,
  CaptureStatus,
} from "../lib/messages.js";

const TOKEN_SERVER_URL = "http://localhost:7890";
const SFU_URL = "ws://localhost:7880";
const tokenProvider = new HttpTokenProvider(TOKEN_SERVER_URL);

let status: CaptureStatus = { active: false };
const statusReady = new Promise<void>((resolve) => {
  chrome.storage.local.get("captureStatus", (result) => {
    if (result.captureStatus) {
      status = result.captureStatus;
    }
    resolve();
  });
});

function persistStatus(): void {
  chrome.storage.local.set({ captureStatus: status });
}

chrome.runtime.onMessage.addListener(
  (
    msg: PopupToSW | OffscreenToSW,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: CaptureStatus | undefined) => void,
  ) => {
    switch (msg.type) {
      case "START_CAPTURE":
        statusReady
          .then(() => handleStartCapture(msg.room, msg.identity))
          .then(sendResponse);
        return true;
      case "STOP_CAPTURE":
        statusReady.then(() => handleStopCapture()).then(sendResponse);
        return true;
      case "GET_STATUS":
        statusReady.then(() => sendResponse(status));
        return true;
      case "CAPTURE_STARTED":
        status = { active: true, room: msg.room };
        persistStatus();
        return false;
      case "CAPTURE_STOPPED":
      case "CAPTURE_ERROR":
        status = { active: false };
        persistStatus();
        return false;
    }
  },
);

async function ensureOffscreenDocument(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (contexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: "src/offscreen/offscreen.html",
      reasons: [chrome.offscreen.Reason.DISPLAY_MEDIA],
      justification: "Screen capture and WebRTC publishing",
    });
  }
}

async function handleStartCapture(
  room: string,
  identity: string,
): Promise<CaptureStatus> {
  try {
    const [token] = await Promise.all([
      tokenProvider.getToken({ room, identity, canPublish: true }),
      ensureOffscreenDocument(),
    ]);
    const msg: SWToOffscreen = {
      type: "START_CAPTURE",
      room,
      identity,
      sfuUrl: SFU_URL,
      token,
    };
    await chrome.runtime.sendMessage(msg);
    status = { active: true, room, identity };
    persistStatus();
  } catch (err) {
    console.error("handleStartCapture failed:", err);
    status = { active: false };
    persistStatus();
  }
  return status;
}

async function closeOffscreenDocument(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (contexts.length > 0) {
    await chrome.offscreen.deleteDocument();
  }
}

async function handleStopCapture(): Promise<CaptureStatus> {
  try {
    await chrome.runtime.sendMessage({ type: "STOP_CAPTURE" } as SWToOffscreen);
  } catch {
    // offscreen doc may already be closed
  }
  await closeOffscreenDocument();
  status = { active: false };
  persistStatus();
  return status;
}
