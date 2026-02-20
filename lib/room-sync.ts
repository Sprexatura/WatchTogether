import { PREPARE_SECONDS } from "@/lib/constants";

export type RoomSnapshot = {
  state: "idle" | "prepare" | "playing" | "paused";
  start_s: number | null;
  end_s: number | null;
  prepare_started_at: string | null;
};

export function getTargetTime(snapshot: RoomSnapshot, nowMs = Date.now()) {
  const start = snapshot.start_s ?? 0;
  if (!snapshot.prepare_started_at) return start;

  const prepareAt = new Date(snapshot.prepare_started_at).getTime();
  const playStartAt = prepareAt + PREPARE_SECONDS * 1000;

  if (nowMs < playStartAt) return start;

  const elapsed = (nowMs - playStartAt) / 1000;
  const target = start + elapsed;

  if (snapshot.end_s == null) return target;
  return Math.min(target, snapshot.end_s);
}

export function getPrepareRemaining(snapshot: RoomSnapshot, nowMs = Date.now()) {
  if (!snapshot.prepare_started_at || snapshot.state !== "prepare") return 0;
  const prepareAt = new Date(snapshot.prepare_started_at).getTime();
  const endAt = prepareAt + PREPARE_SECONDS * 1000;
  return Math.max(0, Math.ceil((endAt - nowMs) / 1000));
}
