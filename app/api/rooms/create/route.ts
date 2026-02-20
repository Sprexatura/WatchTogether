import { NextResponse } from "next/server";
import { generateHostToken, generateRoomId } from "@/lib/room";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { serverError } from "@/lib/http";

export async function POST() {
  if (!supabaseAdmin) return serverError("Supabase is not configured");

  const roomId = generateRoomId();
  const hostToken = generateHostToken();

  const { error } = await supabaseAdmin.from("rooms").insert({
    id: roomId,
    host_token: hostToken,
    state: "idle",
    seq: 0,
  });

  if (error) {
    return serverError(error.message);
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const viewerUrl = `${origin}/room/${roomId}`;
  const hostUrl = `${origin}/host/${roomId}?token=${hostToken}`;

  return NextResponse.json({ roomId, hostUrl, viewerUrl });
}
