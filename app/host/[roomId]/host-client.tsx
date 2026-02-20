"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Submission = {
  id: string;
  display_name: string | null;
  youtube_url: string;
  video_id: string;
  start_s: number;
  end_s: number | null;
  message: string | null;
  status: "pending" | "approved";
};

type Room = {
  id: string;
  state: "idle" | "prepare" | "playing" | "paused";
  seq: number;
  current_submission_id: string | null;
};

export default function HostClient({ roomId, token }: { roomId: string; token: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [pending, setPending] = useState<Submission[]>([]);
  const [approved, setApproved] = useState<Submission[]>([]);
  const [message, setMessage] = useState("");

  const viewerUrl = useMemo(() => {
    if (typeof window === "undefined") return `/room/${roomId}`;
    return `${window.location.origin}/room/${roomId}`;
  }, [roomId]);

  const refresh = useCallback(async () => {
    const [roomRes, queueRes] = await Promise.all([
      fetch(`/api/rooms/${roomId}`),
      fetch(`/api/host/queue?roomId=${roomId}&token=${token}`),
    ]);

    if (roomRes.ok) setRoom(await roomRes.json());
    if (queueRes.ok) {
      const data = await queueRes.json();
      setPending(data.pending || []);
      setApproved(data.approved || []);
    }
  }, [roomId, token]);

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

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <h1 className="text-xl font-bold">Host Console · {roomId}</h1>
        <p className="text-red-600">Missing host token in URL.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <h1 className="text-xl font-bold">Host Console · {roomId}</h1>
      <p>State: {room?.state ?? "-"}</p>

      <div className="flex gap-3">
        <button className="rounded border px-3 py-2" onClick={() => navigator.clipboard.writeText(viewerUrl)}>
          Copy Viewer Link
        </button>
        <button className="rounded border px-3 py-2" onClick={() => post("/api/host/pause", { roomId, token }, "Paused")}>PAUSE</button>
        <button className="rounded border px-3 py-2" onClick={() => post("/api/host/stop", { roomId, token }, "Stopped")}>STOP</button>
      </div>

      {message && <p className="text-sm">{message}</p>}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded border p-4">
          <h2 className="font-semibold">Pending</h2>
          {pending.length === 0 && <p className="text-sm">No pending submissions</p>}
          {pending.map((item) => (
            <article key={item.id} className="rounded border p-3 text-sm">
              <p>
                <strong>{item.display_name || "Anonymous"}</strong>
              </p>
              <p>{item.youtube_url}</p>
              <p>
                {item.start_s}s ~ {item.end_s ?? "?"}s
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  className="rounded bg-black px-3 py-1 text-white"
                  onClick={() =>
                    post(`/api/host/submissions/${item.id}/approve`, { roomId, token }, "Approved")
                  }
                >
                  Approve
                </button>
                <button
                  className="rounded border px-3 py-1"
                  onClick={() =>
                    post(`/api/host/submissions/${item.id}/reject`, { roomId, token }, "Rejected")
                  }
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-3 rounded border p-4">
          <h2 className="font-semibold">Approved</h2>
          {approved.length === 0 && <p className="text-sm">No approved submissions</p>}
          {approved.map((item) => (
            <article key={item.id} className="rounded border p-3 text-sm">
              <p>
                <strong>{item.display_name || "Anonymous"}</strong>
              </p>
              <p>{item.youtube_url}</p>
              <button
                className="mt-2 rounded bg-black px-3 py-1 text-white"
                onClick={() =>
                  post(
                    "/api/host/load",
                    { roomId, token, submissionId: item.id },
                    "Loaded (20s prepare)",
                  )
                }
              >
                LOAD
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
