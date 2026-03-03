import { LiveKitSFUProvider, HttpTokenProvider } from "@mirror/shared";

const TOKEN_SERVER = "";
const SFU_URL = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/livekit`;

const tokenProvider = new HttpTokenProvider(TOKEN_SERVER);
const sfu = new LiveKitSFUProvider();

const joinEl = document.getElementById("join")!;
const viewerEl = document.getElementById("viewer")!;
const roomInput = document.getElementById("room") as HTMLInputElement;
const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status")!;
const videoContainer = document.getElementById("videos")!;
const fullscreenBtn = document.getElementById("fullscreenBtn")!;
const backBtn = document.getElementById("backBtn")!;

function getRoomFromPath(): string | null {
  const segment = window.location.pathname.split("/").filter(Boolean)[0];
  return segment ? decodeURIComponent(segment) : null;
}

// Auto-connect if room is in the URL path
const pathRoom = getRoomFromPath();
if (pathRoom) {
  roomInput.value = pathRoom;
  connectToRoom(pathRoom);
}

connectBtn.addEventListener("click", () => {
  const room = roomInput.value.trim();
  if (!room) return;
  window.location.href = `/${encodeURIComponent(room)}`;
});

fullscreenBtn.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    viewerEl.requestFullscreen();
  }
});

backBtn.addEventListener("click", () => {
  sfu.disconnect();
  window.location.href = "/";
});

async function connectToRoom(room: string): Promise<void> {
  joinEl.classList.add("hidden");
  viewerEl.classList.remove("hidden");
  statusEl.textContent = "Connecting...";

  try {
    const token = await tokenProvider.getToken({
      room,
      identity: `viewer-${crypto.randomUUID()}`,
      canPublish: false,
    });
    await sfu.connect(SFU_URL, token);
    statusEl.textContent = room;
  } catch (err) {
    statusEl.textContent = `Failed: ${err}`;
    // Return to join screen after a moment
    setTimeout(() => {
      viewerEl.classList.add("hidden");
      joinEl.classList.remove("hidden");
    }, 3000);
  }
}

sfu.on("trackSubscribed", (track, info) => {
  if (track.kind === "video") {
    const video = document.createElement("video");
    video.srcObject = new MediaStream([track]);
    video.autoplay = true;
    video.playsInline = true;
    video.dataset.trackSid = info.trackSid;
    videoContainer.appendChild(video);
  }
  if (track.kind === "audio") {
    const audio = document.createElement("audio");
    audio.srcObject = new MediaStream([track]);
    audio.autoplay = true;
    audio.dataset.trackSid = info.trackSid;
    videoContainer.appendChild(audio);
  }
});

sfu.on("trackUnsubscribed", (info) => {
  const el = videoContainer.querySelector(
    `[data-track-sid="${CSS.escape(info.trackSid)}"]`,
  ) as HTMLMediaElement | null;
  if (el) {
    el.pause();
    el.srcObject = null;
    el.remove();
  }
});

sfu.on("disconnected", (reason) => {
  statusEl.textContent = `Disconnected${reason ? `: ${reason}` : ""}`;
  videoContainer.querySelectorAll<HTMLMediaElement>("video, audio").forEach((el) => {
    el.pause();
    el.srcObject = null;
  });
  videoContainer.innerHTML = "";
});
