"use client";

import { useEffect, useMemo, useState } from "react";
import { getPrepareRemaining } from "@/lib/room-sync";

const PLAYBACK_UNLOCK_KEY = "wt_playback_unlocked";

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
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(PLAYBACK_UNLOCK_KEY) === "1";
  });

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
      mute: "0",
      playsinline: "1",
      enablejsapi: "1",
    });

    if (room.end_s != null) {
      params.set("end", String(room.end_s));
    }

    return `https://www.youtube.com/embed/${room.video_id}?${params.toString()}`;
  }, [room, enabled]);

  const onEnable = () => {
    setEnabled(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(PLAYBACK_UNLOCK_KEY, "1");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <h1 className="text-xl font-bold">시청자 화면 · {roomId}</h1>

      {!enabled && (
        <section className="rounded border-2 border-orange-300 bg-orange-50 p-5">
          <p className="mb-3 text-base font-semibold">⚠️ 시작 전에 1번만 클릭해 주세요</p>
          <p className="mb-4 text-sm text-gray-700">
            브라우저 정책 때문에 첫 1회는 사용자가 재생을 허용해야 합니다. 누르면 이 세션에서는 다시 묻지 않습니다.
          </p>
          <button className="rounded bg-black px-5 py-3 text-white" onClick={onEnable}>
            Enable Playback (필수)
          </button>
        </section>
      )}

      <section className="rounded border p-4 text-sm">
        <h2 className="mb-2 font-semibold">시청 방법</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>처음에 Enable Playback 버튼을 1회 클릭합니다.</li>
          <li>이 탭은 열어두고 대기합니다.</li>
          <li>호스트가 LOAD를 누르면 20초 준비 카운트다운 뒤 자동 재생됩니다.</li>
        </ol>
      </section>

      {room?.state === "prepare" && <p>준비 중... {countdown}s</p>}
      {room?.state === "idle" && <p>호스트가 영상을 불러오길 기다리는 중입니다.</p>}

      <div className="relative aspect-video w-full overflow-hidden rounded border bg-black">
        {embedUrl ? (
          <iframe
            key={`${room?.video_id}-${room?.seq}-${enabled}`}
            title="YouTube Sidecar"
            src={embedUrl}
            className="h-full w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white">아직 불러온 영상이 없습니다.</div>
        )}

        {!enabled && room?.video_id && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <button className="rounded bg-white px-4 py-2 text-black" onClick={onEnable}>
              재생 허용하기
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
