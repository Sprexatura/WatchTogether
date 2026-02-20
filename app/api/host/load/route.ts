import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_CLIP_SECONDS, MAX_CLIP_SECONDS } from "@/lib/constants";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { verifyHost } from "@/lib/host";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseFlexibleTimeToSeconds } from "@/lib/time";
import { parseYouTubeVideoId } from "@/lib/youtube";

const bodySchema = z
  .object({
    roomId: z.string().min(1),
    token: z.string().min(1),
    submissionId: z.string().uuid().optional(),
    youtubeUrl: z.string().url().optional(),
    start: z.union([z.string(), z.number()]).optional(),
    end: z.union([z.string(), z.number()]).optional().nullable(),
  })
  .refine((v) => Boolean(v.submissionId || v.youtubeUrl), {
    message: "Either submissionId or youtubeUrl is required",
  });

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return serverError("Supabase is not configured");

  const payload = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());

  const { roomId, token, submissionId, youtubeUrl, start, end } = parsed.data;
  const isHost = await verifyHost(roomId, token);
  if (!isHost) return unauthorized();

  let videoId: string;
  let startS: number;
  let endS: number | null;
  let currentSubmissionId: string | null = null;

  if (submissionId) {
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("submissions")
      .select("id, room_id, video_id, start_s, end_s, status")
      .eq("id", submissionId)
      .eq("room_id", roomId)
      .maybeSingle();

    if (submissionError) return serverError(submissionError.message);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (submission.status !== "approved") {
      return badRequest("Only approved submissions can be loaded");
    }

    videoId = submission.video_id;
    startS = submission.start_s;
    endS = submission.end_s;
    currentSubmissionId = submission.id;
  } else {
    try {
      videoId = parseYouTubeVideoId(youtubeUrl ?? "");
      startS = parseFlexibleTimeToSeconds(start ?? 0);
      const parsedEnd =
        end == null || end === ""
          ? startS + DEFAULT_CLIP_SECONDS
          : parseFlexibleTimeToSeconds(end);
      endS = Math.min(parsedEnd, startS + MAX_CLIP_SECONDS);
    } catch (e) {
      return badRequest(e instanceof Error ? e.message : "Invalid clip input");
    }

    if (!(startS >= 0 && endS > startS)) {
      return badRequest("Must satisfy: 0 ≤ start < end");
    }
  }

  const { data: room, error: roomError } = await supabaseAdmin
    .from("rooms")
    .select("seq")
    .eq("id", roomId)
    .single();

  if (roomError) return serverError(roomError.message);

  const { data, error } = await supabaseAdmin
    .from("rooms")
    .update({
      state: "prepare",
      current_submission_id: currentSubmissionId,
      video_id: videoId,
      start_s: startS,
      end_s: endS,
      prepare_started_at: new Date().toISOString(),
      seq: (room.seq ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .select("*")
    .single();

  if (error) return serverError(error.message);

  return NextResponse.json(data);
}
