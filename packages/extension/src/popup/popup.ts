import type { PopupToSW, CaptureStatus } from "../lib/messages.js";

const roomInput = document.getElementById("room") as HTMLInputElement;
const identityInput = document.getElementById("identity") as HTMLInputElement;
const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status")!;

// Load persisted values
chrome.storage.local.get(["popupRoom", "popupIdentity"], (result) => {
  if (result.popupRoom) roomInput.value = result.popupRoom;
  if (result.popupIdentity) identityInput.value = result.popupIdentity;
});

// Get current status on popup open
chrome.runtime.sendMessage(
  { type: "GET_STATUS" } satisfies PopupToSW,
  (s: CaptureStatus) => {
    if (s) updateUI(s);
  },
);

startBtn.addEventListener("click", async () => {
  const room = roomInput.value.trim();
  const identity = identityInput.value.trim();
  if (!room || !identity) return;

  // Persist input values
  chrome.storage.local.set({ popupRoom: room, popupIdentity: identity });

  startBtn.disabled = true;
  statusEl.textContent = "Starting...";

  const msg: PopupToSW = { type: "START_CAPTURE", room, identity };
  chrome.runtime.sendMessage(msg, (s: CaptureStatus) => {
    updateUI(s);
  });
});

stopBtn.addEventListener("click", () => {
  stopBtn.disabled = true;
  statusEl.textContent = "Stopping...";

  chrome.runtime.sendMessage(
    { type: "STOP_CAPTURE" } satisfies PopupToSW,
    (s: CaptureStatus) => {
      updateUI(s);
    },
  );
});

function updateUI(s: CaptureStatus): void {
  statusEl.textContent = s.active ? `Sharing: ${s.room}` : "Not sharing";
  startBtn.disabled = s.active;
  stopBtn.disabled = !s.active;
}
