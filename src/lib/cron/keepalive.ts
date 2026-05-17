import { createClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl, hasSupabaseEnv } from "@/utils/supabase/keys";

export type KeepaliveResult = {
  ok: boolean;
  checkedAt: string;
  error?: string;
  tables?: Record<string, boolean>;
};

export async function pingSupabase(): Promise<KeepaliveResult> {
  const checkedAt = new Date().toISOString();
  if (!hasSupabaseEnv()) {
    return { ok: false, checkedAt, error: "missing_supabase_env" };
  }

  const supabase = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const checks = [
    { name: "profiles", run: () => supabase.from("profiles").select("id").limit(1) },
    { name: "company_settings", run: () => supabase.from("company_settings").select("id").limit(1) },
    { name: "clients", run: () => supabase.from("clients").select("id").limit(1) },
  ];

  const tables: Record<string, boolean> = {};
  for (const { name, run } of checks) {
    const { error } = await run();
    tables[name] = !error;
    if (error) {
      return { ok: false, checkedAt, error: error.message, tables };
    }
  }

  return { ok: true, checkedAt, tables };
}
