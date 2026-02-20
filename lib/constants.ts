export const PREPARE_SECONDS = 20;
export const DEFAULT_CLIP_SECONDS = 30;
export const MAX_CLIP_SECONDS = 60;

export const ROOM_STATES = ["idle", "prepare", "playing", "paused"] as const;
export type RoomState = (typeof ROOM_STATES)[number];

export const SUBMISSION_STATUS = [
  "pending",
  "approved",
  "rejected",
  "played",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUS)[number];
