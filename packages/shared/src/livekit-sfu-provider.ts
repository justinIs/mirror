import { Room, RoomEvent, Track } from "livekit-client";
import type { TrackInfo, TrackSource } from "./types";

export interface SFUProviderEvents {
  connected: () => void;
  disconnected: (reason?: string) => void;
  trackSubscribed: (track: MediaStreamTrack, info: TrackInfo) => void;
  trackUnsubscribed: (info: TrackInfo) => void;
}

export interface SFUProvider {
  connect(url: string, token: string): Promise<void>;
  disconnect(): Promise<void>;
  publishTrack(
    track: MediaStreamTrack,
    options?: { name?: string; simulcast?: boolean },
  ): Promise<TrackInfo>;
  unpublishTrack(trackSid: string): Promise<void>;
  on<E extends keyof SFUProviderEvents>(
    event: E,
    listener: SFUProviderEvents[E],
  ): void;
  off<E extends keyof SFUProviderEvents>(
    event: E,
    listener: SFUProviderEvents[E],
  ): void;
}

type Listener = (...args: never[]) => void;

export class LiveKitSFUProvider implements SFUProvider {
  private room: Room;
  private listeners = new Map<string, Set<Listener>>();
  private roomCleanup: (() => void) | null = null;

  constructor() {
    this.room = new Room({ adaptiveStream: true, dynacast: true });
  }

  async connect(url: string, token: string): Promise<void> {
    this.removeRoomListeners();
    this.setupRoomListeners();
    await this.room.connect(url, token);
    this.emit("connected");
  }

  async disconnect(): Promise<void> {
    this.removeRoomListeners();
    await this.room.disconnect();
    this.emit("disconnected");
    this.listeners.clear();
  }

  async publishTrack(
    track: MediaStreamTrack,
    options?: { name?: string; simulcast?: boolean },
  ): Promise<TrackInfo> {
    const pub = await this.room.localParticipant.publishTrack(track, {
      name: options?.name,
      simulcast: options?.simulcast,
      source:
        track.kind === "video"
          ? Track.Source.ScreenShare
          : Track.Source.ScreenShareAudio,
    });
    return {
      trackSid: pub.trackSid,
      source: track.kind === "video" ? "screen" : "screen_audio",
    };
  }

  async unpublishTrack(trackSid: string): Promise<void> {
    const pub = this.room.localParticipant.trackPublications.get(trackSid);
    if (pub?.track) {
      await this.room.localParticipant.unpublishTrack(pub.track);
    }
  }

  private setupRoomListeners(): void {
    const onTrackSubscribed = (
      track: { mediaStreamTrack: MediaStreamTrack },
      publication: { trackSid: string; source?: Track.Source },
    ) => {
      this.emit("trackSubscribed", track.mediaStreamTrack, {
        trackSid: publication.trackSid,
        source: mapSource(publication.source),
      });
    };

    const onTrackUnsubscribed = (
      _track: unknown,
      publication: { trackSid: string; source?: Track.Source },
    ) => {
      this.emit("trackUnsubscribed", {
        trackSid: publication.trackSid,
        source: mapSource(publication.source),
      });
    };

    const onDisconnected = (reason?: unknown) => {
      this.emit("disconnected", String(reason ?? ""));
    };

    this.room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    this.room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    this.room.on(RoomEvent.Disconnected, onDisconnected);

    this.roomCleanup = () => {
      this.room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      this.room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
      this.room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }

  private removeRoomListeners(): void {
    this.roomCleanup?.();
    this.roomCleanup = null;
  }

  on<E extends keyof SFUProviderEvents>(
    event: E,
    fn: SFUProviderEvents[E],
  ): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn as Listener);
  }

  off<E extends keyof SFUProviderEvents>(
    event: E,
    fn: SFUProviderEvents[E],
  ): void {
    this.listeners.get(event)?.delete(fn as Listener);
  }

  private emit(event: string, ...args: unknown[]): void {
    this.listeners
      .get(event)
      ?.forEach((fn) => (fn as (...a: unknown[]) => void)(...args));
  }
}

function mapSource(source?: Track.Source): TrackSource {
  return source === Track.Source.ScreenShareAudio ? "screen_audio" : "screen";
}
