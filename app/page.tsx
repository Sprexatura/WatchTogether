"use client";

import { useState } from "react";

type CreateRoomResponse = {
  roomId: string;
  hostUrl: string;
  viewerUrl: string;
};

export default function HomePage() {
  const [result, setResult] = useState<CreateRoomResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/rooms/create", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data?.error || "Failed to create room");
      setLoading(false);
      return;
    }

    setResult(data);
    setLoading(false);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold">WatchTogether MVP</h1>
      <button
        className="w-fit rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        onClick={createRoom}
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Room"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <section className="space-y-3 rounded border p-4">
          <p>
            <strong>Room ID:</strong> {result.roomId}
          </p>
          <p>
            <strong>Host URL:</strong>{" "}
            <a className="text-blue-600 underline" href={result.hostUrl}>
              {result.hostUrl}
            </a>
          </p>
          <p>
            <strong>Viewer URL:</strong>{" "}
            <a className="text-blue-600 underline" href={result.viewerUrl}>
              {result.viewerUrl}
            </a>
          </p>
        </section>
      )}
    </main>
  );
}
