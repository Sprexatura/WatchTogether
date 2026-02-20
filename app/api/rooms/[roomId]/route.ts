import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { badRequest, serverError } from "@/lib/http";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  if (!supabaseAdmin) return serverError("Supabase is not configured");

  const { roomId } = await params;
  if (!roomId) return badRequest("roomId is required");

  const { data, error } = await supabaseAdmin
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (error) return serverError(error.message);
  if (!data) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  return NextResponse.json(data);
}
