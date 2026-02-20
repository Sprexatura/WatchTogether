import { NextRequest, NextResponse } from "next/server";
import { verifyHost } from "@/lib/host";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return serverError("Supabase is not configured");

  const roomId = req.nextUrl.searchParams.get("roomId");
  const token = req.nextUrl.searchParams.get("token");

  if (!roomId || !token) return badRequest("roomId and token are required");

  const isHost = await verifyHost(roomId, token);
  if (!isHost) return unauthorized();

  const { data, error } = await supabaseAdmin
    .from("submissions")
    .select("*")
    .eq("room_id", roomId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: true });

  if (error) return serverError(error.message);

  const pending = data.filter((s) => s.status === "pending");
  const approved = data.filter((s) => s.status === "approved");

  return NextResponse.json({ pending, approved });
}
