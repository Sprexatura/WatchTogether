import { supabaseAdmin } from "@/lib/supabase/admin";

export async function verifyHost(roomId: string, token: string) {
  if (!supabaseAdmin) throw new Error("Supabase is not configured");

  const { data, error } = await supabaseAdmin
    .from("rooms")
    .select("id, host_token")
    .eq("id", roomId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return false;

  return data.host_token === token;
}
