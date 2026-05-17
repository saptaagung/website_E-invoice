import { getSupabaseClientOrThrow } from "@/utils/supabase/client";

export function getSupabase() {
  return getSupabaseClientOrThrow();
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
