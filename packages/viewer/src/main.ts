import { LiveKitSFUProvider, HttpTokenProvider } from "@mirror/shared";

const TOKEN_SERVER = "http://localhost:7880";
const SFU_URL = "ws://localhost:7881";

const tokenProvider = new HttpTokenProvider(TOKEN_SERVER);
const sfu = new LiveKitSFUProvider();

const roomInput = document.getElementById("room") as HTMLInputElement;
const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status")!;
const videoContainer = document.getElementById("videos")!;

connectBtn.addEventListener("click", async () => {
  const room = roomInput.value.trim();
  if (!room) return;

  connectBtn.disabled = true;
  statusEl.textContent = "Connecting...";

  try {
    const token = await tokenProvider.getToken({
      room,
      identity: `viewer-${crypto.randomUUID()}`,
      canPublish: false,
    });
    await sfu.connect(SFU_URL, token);
    statusEl.textContent = `Connected to room: ${room}`;
  } catch (err) {
    statusEl.textContent = `Failed to connect: ${err}`;
    connectBtn.disabled = false;
  }
});

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
  connectBtn.disabled = false;
  videoContainer.querySelectorAll<HTMLMediaElement>("video, audio").forEach((el) => {
    el.pause();
    el.srcObject = null;
  });
  videoContainer.innerHTML = "";
});
