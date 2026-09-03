/**
 * Supabase URL + key for browser and server clients.
 * Invalid URL causes: "Failed to execute 'fetch' on 'Window': Invalid value"
 */

function stripEnv(value: string | undefined): string {
  if (!value) return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/** Project URL only: `https://<ref>.supabase.co` — never `/rest/v1` */
function normalizeSupabaseUrl(raw: string): string {
  let u = stripEnv(raw);
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
  return stripEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    // Allow local development URL
    if (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") {
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    }
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".supabase.co") &&
      parsed.hostname.length > ".supabase.co".length
    );
  } catch {
    return false;
  }
}

export function hasSupabaseEnv(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  return Boolean(url && key && isValidSupabaseUrl(url) && !isPlaceholderConfig(url, key));
}

function isPlaceholderConfig(url: string, key: string): boolean {
  if (url.includes("YOUR_PROJECT_REF") || url.includes("xxxx")) return true;
  if (key.includes("xxxxxxxx") || key === "sb_publishable_xxxxxxxx") return true;
  return false;
}

/** User-facing message when auth/data calls would fail */
export function getSupabaseConfigError(): string | null {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  if (!url || !key) {
    return (
      "Supabase belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL dan " +
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di .env.local (lokal) atau Vercel → Environment Variables, lalu redeploy."
    );
  }

  if (isPlaceholderConfig(url, key)) {
    return "Environment variable masih berisi placeholder. Ganti dengan URL dan key asli dari Supabase → Settings → API.";
  }

  if (!isValidSupabaseUrl(url)) {
    return (
      `URL Supabase tidak valid: "${url}". ` +
      "Gunakan format https://abcdefgh.supabase.co (tanpa /rest/v1, tanpa spasi)."
    );
  }

  if (key.length < 20) {
    return "Supabase API key terlalu pendek atau kosong. Salin publishable/anon key dari Supabase → Settings → API.";
  }

  return null;
}
