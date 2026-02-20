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
      <h1 className="text-xl font-bold">시청자 화면 · {roomId}</h1>

      {!enabled && (
        <section className="rounded border bg-yellow-50 p-4">
          <p className="mb-3 text-sm">
            1) 먼저 <strong>Enable Playback</strong>을 한 번 눌러야 자동재생이 풀립니다.
          </p>
          <button className="rounded bg-black px-4 py-3 text-white" onClick={() => setEnabled(true)}>
            Enable Playback
          </button>
        </section>
      )}

      {enabled && muted && (
        <section className="rounded border bg-blue-50 p-4">
          <p className="mb-3 text-sm">
            2) 소리를 들으려면 <strong>Unmute</strong>를 누르세요. (안 눌러도 영상은 재생됨)
          </p>
          <button className="w-fit rounded border px-3 py-2" onClick={() => setMuted(false)}>
            Unmute
          </button>
        </section>
      )}

      <section className="rounded border p-4 text-sm">
        <h2 className="mb-2 font-semibold">시청 방법</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>이 탭은 열어두고 대기합니다.</li>
          <li>호스트가 LOAD를 누르면 20초 준비 카운트다운이 시작됩니다.</li>
          <li>카운트다운 후 자동 재생되고, 지연이 있으면 자동 동기화됩니다.</li>
        </ol>
      </section>

      {room?.state === "prepare" && <p>준비 중... {countdown}s</p>}
      {room?.state === "idle" && <p>호스트가 영상을 불러오길 기다리는 중입니다.</p>}

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
          <div className="flex h-full items-center justify-center text-white">아직 불러온 영상이 없습니다.</div>
        )}
      </div>
    </main>
  );
}
