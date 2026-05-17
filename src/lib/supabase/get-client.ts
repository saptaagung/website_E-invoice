import { createClient } from "@/utils/supabase/client";

export function getSupabase() {
  const supabase = createClient();
  if (!supabase) {
    throw new Error("Supabase belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL dan key di .env.local");
  }
  return supabase;
}

export async function requireUserId(): Promise<string> {
  const supabase = getSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user.id;
}
