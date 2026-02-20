import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { verifyHost } from "@/lib/host";
import { supabaseAdmin } from "@/lib/supabase/admin";

const bodySchema = z.object({
  roomId: z.string().min(1),
  token: z.string().min(1),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!supabaseAdmin) return serverError("Supabase is not configured");

  const { id } = await params;
  const payload = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);

  if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());

  const { roomId, token } = parsed.data;
  const isHost = await verifyHost(roomId, token);
  if (!isHost) return unauthorized();

  const { data, error } = await supabaseAdmin
    .from("submissions")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("room_id", roomId)
    .select("*")
    .maybeSingle();

  if (error) return serverError(error.message);
  if (!data) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  return NextResponse.json(data);
}
