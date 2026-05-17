import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl, hasSupabaseEnv } from "./keys";

export function createClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Server Component — middleware refreshes session */
        }
      },
    },
  });
}

export async function createServerSupabase(): Promise<SupabaseClient | null> {
  if (!hasSupabaseEnv()) return null;
  const cookieStore = await cookies();
  return createClient(cookieStore);
}
