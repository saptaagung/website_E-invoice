import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseConfigError,
  getSupabasePublishableKey,
  getSupabaseUrl,
  hasSupabaseEnv,
} from "./keys";

export function createClient(): SupabaseClient | null {
  if (!hasSupabaseEnv()) return null;

  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  return createBrowserClient(url, key);
}

export function getSupabaseClientOrThrow(): SupabaseClient {
  const configError = getSupabaseConfigError();
  if (configError) {
    throw new Error(configError);
  }

  const client = createClient();
  if (!client) {
    throw new Error(getSupabaseConfigError() ?? "Supabase client tidak tersedia.");
  }

  return client;
}
