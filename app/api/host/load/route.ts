import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { verifyHost } from "@/lib/host";
import { supabaseAdmin } from "@/lib/supabase/admin";

const bodySchema = z.object({
  roomId: z.string().min(1),
  token: z.string().min(1),
  submissionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return serverError("Supabase is not configured");

  const payload = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());

  const { roomId, token, submissionId } = parsed.data;
  const isHost = await verifyHost(roomId, token);
  if (!isHost) return unauthorized();

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from("submissions")
    .select("id, room_id, video_id, start_s, end_s, status")
    .eq("id", submissionId)
    .eq("room_id", roomId)
    .maybeSingle();

  if (submissionError) return serverError(submissionError.message);
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (submission.status !== "approved") {
    return badRequest("Only approved submissions can be loaded");
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
      current_submission_id: submission.id,
      video_id: submission.video_id,
      start_s: submission.start_s,
      end_s: submission.end_s,
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
