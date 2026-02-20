"use client";

import { useEffect, useMemo, useState } from "react";
import { getPrepareRemaining } from "@/lib/room-sync";

type RoomState = {
  id: string;
  state: "idle" | "prepare" | "playing" | "paused";
  video_id: string | null;
  start_s: number;
  end_s: number | null;
  prepare_started_at: string | null;
  seq: number;
};

export default function ViewerClient({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRoom = async () => {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (mounted) setRoom(data);
    };

    fetchRoom();
    const timer = setInterval(fetchRoom, 1000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [roomId]);

  const countdown = useMemo(() => {
    if (!room) return 0;
    return getPrepareRemaining(room);
  }, [room]);

  const embedUrl = useMemo(() => {
    if (!room?.video_id) return "";
    const params = new URLSearchParams({
      start: String(room.start_s || 0),
      autoplay: enabled ? "1" : "0",
      mute: muted ? "1" : "0",
      playsinline: "1",
      enablejsapi: "1",
    });

    return `https://www.youtube.com/embed/${room.video_id}?${params.toString()}`;
  }, [room, enabled, muted]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <h1 className="text-xl font-bold">Viewer Sidecar · {roomId}</h1>

      {!enabled && (
        <button className="rounded bg-black px-4 py-3 text-white" onClick={() => setEnabled(true)}>
          Enable Playback
        </button>
      )}

      {enabled && muted && (
        <button className="w-fit rounded border px-3 py-2" onClick={() => setMuted(false)}>
          Unmute
        </button>
      )}

      {room?.state === "prepare" && <p>Preparing... {countdown}s</p>}
      {room?.state === "idle" && <p>Waiting for host to load a video</p>}

      <div className="aspect-video w-full overflow-hidden rounded border bg-black">
        {embedUrl ? (
          <iframe
            key={`${room?.video_id}-${room?.seq}-${enabled}-${muted}`}
            title="YouTube Sidecar"
            src={embedUrl}
            className="h-full w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white">No video loaded</div>
        )}
      </div>

      <section className="rounded border p-4 text-sm">
        <p>Host controls playback. This page only syncs and plays the loaded clip.</p>
      </section>
    </main>
  );
}
