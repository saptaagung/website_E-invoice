import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl } from "./keys";

export function createClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
