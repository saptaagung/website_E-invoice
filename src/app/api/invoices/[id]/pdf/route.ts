import { NextResponse } from "next/server";
import { toCamel } from "@/lib/case";
import { generateInvoicePDF } from "@/lib/pdf.js";
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

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, client:clients(*), items:invoice_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const pdfBuffer = await generateInvoicePDF(toCamel(invoice), toCamel(settings ?? {}));
  const clientName = (invoice.client as { name?: string } | null)?.name ?? "Client";
  const dateStr = new Date(invoice.issue_date).toLocaleDateString("id-ID").replace(/\//g, "-");
  const fileName = `Faktur ${clientName} ${dateStr}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
