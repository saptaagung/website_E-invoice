function normalizeSupabaseUrl(raw: string): string {
  let u = raw.trim();
  if (!u) return "";
  u = u.replace(/\/+$/, "");
  if (u.endsWith("/rest/v1")) {
    u = u.slice(0, -"/rest/v1".length).replace(/\/+$/, "");
  }
  return u;
}

export function getSupabaseUrl(): string {
  return normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
}

export function getSupabasePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

export function hasSupabaseEnv(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
