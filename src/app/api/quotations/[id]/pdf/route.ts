import { NextResponse } from "next/server";
import { toCamel } from "@/lib/case";
import { generateQuotationPDF } from "@/lib/pdf.js";
import { createServerSupabase } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: quotation, error } = await supabase
    .from("quotations")
    .select("*, client:clients(*), items:quotation_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const pdfBuffer = await generateQuotationPDF(toCamel(quotation), toCamel(settings ?? {}));
  const clientName = (quotation.client as { name?: string } | null)?.name ?? "Client";
  const dateStr = new Date(quotation.issue_date).toLocaleDateString("id-ID").replace(/\//g, "-");
  const fileName = `Penawaran ${clientName} ${dateStr}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
