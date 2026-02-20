"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const [submitMsg, setSubmitMsg] = useState<string>("");

  const [displayName, setDisplayName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("");
  const [message, setMessage] = useState("");

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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitMsg("Submitting...");

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, displayName, youtubeUrl, start, end, message }),
    });

    const data = await res.json();
    if (!res.ok) {
      setSubmitMsg(data?.error || "Failed to submit");
      return;
    }

    setSubmitMsg("Submitted! Waiting for host approval.");
    setYoutubeUrl("");
    setStart("0");
    setEnd("");
    setMessage("");
  };

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
      {room?.state === "idle" && <p>Waiting for next video</p>}

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

      <form className="space-y-3 rounded border p-4" onSubmit={onSubmit}>
        <h2 className="font-semibold">Submit Clip</h2>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Nickname (optional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="YouTube URL"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input className="rounded border px-3 py-2" placeholder="Start (e.g. 1:23)" value={start} onChange={(e) => setStart(e.target.value)} required />
          <input className="rounded border px-3 py-2" placeholder="End (optional)" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <textarea
          className="w-full rounded border px-3 py-2"
          placeholder="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">
          Submit
        </button>
        {submitMsg && <p className="text-sm">{submitMsg}</p>}
      </form>
    </main>
  );
}
