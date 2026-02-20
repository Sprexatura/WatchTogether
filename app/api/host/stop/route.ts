import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { verifyHost } from "@/lib/host";
import { supabaseAdmin } from "@/lib/supabase/admin";

const bodySchema = z.object({
  roomId: z.string().min(1),
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return serverError("Supabase is not configured");

  const payload = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());

  const { roomId, token } = parsed.data;
  const isHost = await verifyHost(roomId, token);
  if (!isHost) return unauthorized();

  const { data: room, error: roomError } = await supabaseAdmin
    .from("rooms")
    .select("seq, current_submission_id")
    .eq("id", roomId)
    .single();

  if (roomError) return serverError(roomError.message);

  const { data, error } = await supabaseAdmin
    .from("rooms")
    .update({
      state: "idle",
      current_submission_id: null,
      video_id: null,
      start_s: 0,
      end_s: null,
      prepare_started_at: null,
      seq: (room.seq ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .select("*")
    .single();

  if (error) return serverError(error.message);

  if (room.current_submission_id) {
    await supabaseAdmin
      .from("submissions")
      .update({ status: "played" })
      .eq("id", room.current_submission_id)
      .eq("room_id", roomId);
  }

  return NextResponse.json(data);
}
