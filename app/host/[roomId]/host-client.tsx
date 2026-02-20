"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Room = {
  id: string;
  state: "idle" | "prepare" | "playing" | "paused";
  seq: number;
  video_id: string | null;
  start_s: number;
  end_s: number | null;
};

export default function HostClient({ roomId, token }: { roomId: string; token: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("");

  const viewerUrl = useMemo(() => {
    if (typeof window === "undefined") return `/room/${roomId}`;
    return `${window.location.origin}/room/${roomId}`;
  }, [roomId]);

  const refresh = useCallback(async () => {
    const roomRes = await fetch(`/api/rooms/${roomId}`);
    if (roomRes.ok) setRoom(await roomRes.json());
  }, [roomId]);

  useEffect(() => {
    if (!token) return;

    const firstTick = setTimeout(() => {
      void refresh();
    }, 0);

    const timer = setInterval(() => {
      void refresh();
    }, 1000);

    return () => {
      clearTimeout(firstTick);
      clearInterval(timer);
    };
  }, [token, refresh]);

  const post = async (url: string, body: object, okMessage: string) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.error || "Action failed");
      return;
    }

    setMessage(okMessage);
    void refresh();
  };

  const onDirectLoad = async () => {
    await post(
      "/api/host/load",
      {
        roomId,
        token,
        youtubeUrl,
        start,
        end,
      },
      "Loaded (20s prepare)",
    );
  };

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <h1 className="text-xl font-bold">Host Console · {roomId}</h1>
        <p className="text-red-600">Missing host token in URL.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <h1 className="text-xl font-bold">Host Console · {roomId}</h1>
      <p>State: {room?.state ?? "-"}</p>

      <div className="flex flex-wrap gap-3">
        <button className="rounded border px-3 py-2" onClick={() => navigator.clipboard.writeText(viewerUrl)}>
          Copy Viewer Link
        </button>
        <button className="rounded border px-3 py-2" onClick={() => post("/api/host/pause", { roomId, token }, "Paused")}>PAUSE</button>
        <button className="rounded border px-3 py-2" onClick={() => post("/api/host/stop", { roomId, token }, "Stopped")}>STOP</button>
      </div>

      {message && <p className="text-sm">{message}</p>}

      <section className="space-y-3 rounded border p-4">
        <h2 className="font-semibold">Direct Load</h2>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="YouTube URL"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <input className="rounded border px-3 py-2" placeholder="Start (e.g. 1:23)" value={start} onChange={(e) => setStart(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="End (optional)" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <button className="rounded bg-black px-4 py-2 text-white" onClick={onDirectLoad}>
          LOAD
        </button>
      </section>

      <section className="rounded border p-4 text-sm">
        <h2 className="mb-2 font-semibold">Current Clip</h2>
        <p>video_id: {room?.video_id ?? "-"}</p>
        <p>
          start/end: {room?.start_s ?? 0}s ~ {room?.end_s ?? "?"}s
        </p>
      </section>
    </main>
  );
}
