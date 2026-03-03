import { LiveKitSFUProvider } from "@mirror/shared";
import type { SWToOffscreen, OffscreenToSW } from "../lib/messages.js";

let provider: LiveKitSFUProvider | null = null;
let captureStream: MediaStream | null = null;

chrome.runtime.onMessage.addListener(
  (
    msg: SWToOffscreen,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { ok: boolean }) => void,
  ) => {
    if (msg.type === "START_CAPTURE") {
      startCapture(msg.sfuUrl, msg.token, msg.room);
      sendResponse({ ok: true });
    } else if (msg.type === "STOP_CAPTURE") {
      stopCapture();
      sendResponse({ ok: true });
    }
  },
);

async function startCapture(
  sfuUrl: string,
  token: string,
  room: string,
): Promise<void> {
  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
      audio: true,
    });

    provider = new LiveKitSFUProvider();
    await provider.connect(sfuUrl, token);

    await Promise.all(
      captureStream
        .getTracks()
        .map((track) =>
          provider!.publishTrack(track, { name: `mirror-${track.kind}` }),
        ),
    );

    // Detect when user clicks "Stop sharing" in the browser chrome
    captureStream.getVideoTracks()[0]?.addEventListener(
      "ended",
      () => stopCapture(),
      { once: true },
    );

    notify({ type: "CAPTURE_STARTED", room });
  } catch (err) {
    notify({ type: "CAPTURE_ERROR", error: String(err) });
  }
}

async function stopCapture(): Promise<void> {
  captureStream?.getTracks().forEach((t) => t.stop());
  captureStream = null;
  await provider?.disconnect();
  provider = null;
  notify({ type: "CAPTURE_STOPPED" });
}

function notify(msg: OffscreenToSW): void {
  chrome.runtime.sendMessage(msg);
}
