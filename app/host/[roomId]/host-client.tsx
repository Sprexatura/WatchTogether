"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPrepareRemaining } from "@/lib/room-sync";

type Room = {
  id: string;
  state: "idle" | "prepare" | "playing" | "paused";
  seq: number;
  video_id: string | null;
  start_s: number;
  end_s: number | null;
  prepare_started_at: string | null;
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

  const prepareRemaining = useMemo(() => {
    if (!room) return 0;
    return getPrepareRemaining(room);
  }, [room]);

  const monitorEmbedUrl = useMemo(() => {
    if (!room?.video_id) return "";

    const params = new URLSearchParams({
      start: String(room.start_s || 0),
      autoplay: "1",
      mute: "1",
      playsinline: "1",
      enablejsapi: "1",
    });

    if (room.end_s != null) {
      params.set("end", String(room.end_s));
    }

    return `https://www.youtube.com/embed/${room.video_id}?${params.toString()}`;
  }, [room]);

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

      <section className="rounded border p-4 text-sm">
        <h2 className="mb-2 font-semibold">진행 상태</h2>
        <p>상태: {room?.state ?? "-"}</p>
        {room?.state === "prepare" && <p>재생 준비 카운트다운: {prepareRemaining}s</p>}
      </section>

      <div className="flex flex-wrap gap-3">
        <button className="rounded border px-3 py-2" onClick={() => navigator.clipboard.writeText(viewerUrl)}>
          Viewer 링크 복사
        </button>
        <button className="rounded border px-3 py-2" onClick={() => window.open(viewerUrl, "_blank", "noopener,noreferrer")}>
          내 화면에서 Viewer 열기(싱크 확인)
        </button>
        <button className="rounded border px-3 py-2" onClick={() => post("/api/host/pause", { roomId, token }, "Paused")}>
          PAUSE
        </button>
        <button className="rounded border px-3 py-2" onClick={() => post("/api/host/stop", { roomId, token }, "Stopped")}>
          STOP
        </button>
      </div>

      {message && <p className="text-sm">{message}</p>}

      <section className="space-y-3 rounded border p-4">
        <h2 className="font-semibold">Direct Load</h2>
        <p className="text-sm text-gray-600">호스트가 직접 링크를 넣고 LOAD 하면, Viewer는 20초 준비 후 자동 동기화 재생됩니다.</p>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="YouTube URL"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <input className="rounded border px-3 py-2" placeholder="Start (예: 1:23)" value={start} onChange={(e) => setStart(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="End (선택)" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <button className="rounded bg-black px-4 py-2 text-white" onClick={onDirectLoad}>
          LOAD
        </button>
      </section>

      <section className="rounded border p-4 text-sm">
        <h2 className="mb-2 font-semibold">Host Monitor (음소거 미리보기)</h2>
        <p className="mb-3 text-gray-600">호스트도 현재 로드된 영상을 같은 구간으로 확인할 수 있습니다.</p>
        <div className="aspect-video w-full overflow-hidden rounded border bg-black">
          {monitorEmbedUrl ? (
            <iframe
              key={`${room?.video_id}-${room?.seq}-host-monitor`}
              title="Host Monitor"
              src={monitorEmbedUrl}
              className="h-full w-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white">아직 불러온 영상이 없습니다.</div>
          )}
        </div>
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
