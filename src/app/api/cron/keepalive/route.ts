import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { pingSupabase } from "@/lib/cron/keepalive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pingSupabase();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
