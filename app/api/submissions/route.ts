import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseFlexibleTimeToSeconds } from "@/lib/time";
import { parseYouTubeVideoId } from "@/lib/youtube";
import { DEFAULT_CLIP_SECONDS, MAX_CLIP_SECONDS } from "@/lib/constants";
import { badRequest, serverError } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";

const payloadSchema = z.object({
  roomId: z.string().min(1),
  displayName: z.string().max(50).optional().nullable(),
  youtubeUrl: z.string().url(),
  start: z.union([z.string(), z.number()]),
  end: z.union([z.string(), z.number()]).optional().nullable(),
  message: z.string().max(300).optional().nullable(),
});

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return serverError("Supabase is not configured");

  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());

  const { roomId, displayName, youtubeUrl, start, end, message } = parsed.data;

  let videoId: string;
  let startS: number;
  let endS: number;

  try {
    videoId = parseYouTubeVideoId(youtubeUrl);
    startS = parseFlexibleTimeToSeconds(start);
    const rawEnd = end == null || end === "" ? startS + DEFAULT_CLIP_SECONDS : parseFlexibleTimeToSeconds(end);
    endS = Math.min(rawEnd, startS + MAX_CLIP_SECONDS);
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Invalid submission");
  }

  if (!(startS >= 0 && endS > startS)) {
    return badRequest("Must satisfy: 0 ≤ start < end");
  }

  const { data, error } = await supabaseAdmin
    .from("submissions")
    .insert({
      room_id: roomId,
      display_name: displayName || null,
      youtube_url: youtubeUrl,
      video_id: videoId,
      start_s: startS,
      end_s: endS,
      message: message || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return serverError(error.message);

  return NextResponse.json(data, { status: 201 });
}
