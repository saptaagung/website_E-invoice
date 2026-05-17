/**
 * Supabase data layer for InvoiceFlow views
 */
import { toCamel, toSnake } from "@/lib/case";
import { getSupabase, requireUserId } from "@/lib/supabase/get-client";

const mapBankAccount = (acc: Record<string, unknown>) => ({
  id: acc.id,
  bankName: acc.bankName ?? acc.bank_name,
  accountNumber: acc.accountNumber ?? acc.account_num,
  accountHolder: acc.accountHolder ?? acc.holder_name,
  isDefault: acc.isDefault ?? acc.is_default,
});

const mapSettings = (row: Record<string, unknown>) => {
  const s = toCamel(row) as Record<string, unknown>;
  const banks = (row.bank_accounts as Record<string, unknown>[] | undefined) ?? [];
  s.bankAccounts = banks.map((b) => mapBankAccount(toCamel(b) as Record<string, unknown>));
  return s;
};

async function getSettingsRow(userId: string) {
  const supabase = getSupabase();
  let { data, error } = await supabase
    .from("company_settings")
    .select("*, bank_accounts(*)")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    const { data: created, error: insErr } = await supabase
      .from("company_settings")
      .insert({ user_id: userId, company_name: "My Company" })
      .select("*, bank_accounts(*)")
      .single();
    if (insErr) throw new Error(insErr.message);
    data = created;
  }
  return data;
}

function formatDocNumber(
  prefix: string,
  nextNum: number,
  padding: number,
): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const p = prefix.replace("{YYYY}", String(year)).replace("{MM}", month);
  return `${p}${String(nextNum).padStart(padding, "0")}`;
}

// Legacy localStorage helpers (profile cache for UI)
export const setToken = (_token: string | null) => {};
export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
export const setCurrentUser = (user: unknown) => {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
};

export const auth = {
  login: async (email: string, password: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, role, created_at")
      .eq("id", data.user!.id)
      .single();
    const user = {
      id: data.user!.id,
      email: data.user!.email,
      name: profile?.name ?? data.user!.user_metadata?.name ?? "",
      role: profile?.role ?? "user",
    };
    setCurrentUser(user);
    return { user, token: data.session?.access_token };
  },

  register: async (name: string, email: string, password: string) => {
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Registration failed");
    const user = {
      id: data.user.id,
      email: data.user.email,
      name,
      role: "user",
    };
    setCurrentUser(user);
    return { user, token: data.session?.access_token };
  },

  me: async () => {
    const supabase = getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, role, created_at")
      .eq("id", user.id)
      .single();
    const result = {
      id: user.id,
      email: user.email,
      name: profile?.name ?? user.user_metadata?.name ?? "",
      role: profile?.role ?? "user",
      createdAt: profile?.created_at,
    };
    setCurrentUser(result);
    return result;
  },

  logout: async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setCurrentUser(null);
  },
};

export const clients = {
  getAll: async (params: { search?: string; status?: string } = {}) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    let q = supabase.from("clients").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (params.status) q = q.eq("status", params.status);
    if (params.search) {
      q = q.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%,contact_name.ilike.%${params.search}%`);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return toCamel(data ?? []);
  },

  getOne: async (id: string) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  },

  create: async (body: Record<string, unknown>) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    if (!body.name) throw new Error("Client name is required");
    const row = { ...toSnake(body), user_id: userId, country: body.country ?? "Indonesia" };
    const { data, error } = await supabase.from("clients").insert(row).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("clients")
      .update(toSnake(body))
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  },

  delete: async (id: string) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const { error } = await supabase.from("clients").delete().eq("id", id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { message: "Client deleted successfully" };
  },
};

export const invoices = {
  getAll: async (params: Record<string, string> = {}) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    let q = supabase
      .from("invoices")
      .select("*, client:clients(id, name, email), items:invoice_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (params.status) q = q.eq("status", params.status);
    if (params.clientId) q = q.eq("client_id", params.clientId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return toCamel(data ?? []);
  },

  getOne: async (id: string) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("invoices")
      .select("*, client:clients(*), items:invoice_items(*), payments:payment_records(*)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  },

  create: async (body: Record<string, unknown>) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const items = body.items as Record<string, unknown>[];
    if (!body.clientId || !items?.length) throw new Error("Client and items are required");

    const settings = await getSettingsRow(userId);
    const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.rate ?? i.unitPrice ?? 0), 0);
    const tax = Number(body.taxRate ?? 11);
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal + taxAmount - Number(body.discount ?? 0);

    let nextNum = settings.invoice_next_num ?? 1;
    const padding = settings.invoice_padding ?? 5;
    const prefix = settings.invoice_prefix ?? "INV/{YYYY}/{MM}/";
    let invoiceNumber = "";
    for (let i = 0; i < 100; i++) {
      invoiceNumber = formatDocNumber(prefix, nextNum, padding);
      const { data: existing } = await supabase.from("invoices").select("id").eq("invoice_number", invoiceNumber).maybeSingle();
      if (!existing) break;
      nextNum++;
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        client_id: body.clientId,
        user_id: userId,
        issue_date: body.issueDate ?? new Date().toISOString(),
        due_date: body.dueDate ?? new Date(Date.now() + 14 * 86400000).toISOString(),
        project_name: body.projectName,
        po_number: body.poNumber,
        subtotal,
        tax_rate: tax,
        tax_amount: taxAmount,
        discount: body.discount ?? 0,
        total,
        notes: body.notes,
        terms: body.terms,
        bank_account: body.bankAccount,
        signature_name: body.signatureName,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const itemRows = items.map((item) => {
      const rate = Number(item.rate ?? item.unitPrice ?? 0);
      const qty = Number(item.quantity ?? 1);
      return {
        invoice_id: invoice.id,
        group_name: item.groupName ?? null,
        model: item.model ?? null,
        description: item.description,
        quantity: qty,
        unit: item.unit ?? "unit",
        rate,
        amount: qty * rate,
      };
    });
    await supabase.from("invoice_items").insert(itemRows);
    await supabase.from("company_settings").update({ invoice_next_num: nextNum + 1 }).eq("user_id", userId);

    return invoices.getOne(invoice.id);
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const { items, ...rest } = body;
    const updatePayload: Record<string, unknown> = { ...toSnake(rest as Record<string, unknown>) };

    if (items) {
      const list = items as Record<string, unknown>[];
      const subtotal = list.reduce((s, i) => s + Number(i.quantity ?? 1) * Number(i.rate ?? i.unitPrice ?? 0), 0);
      const tax = Number(rest.taxRate ?? 11);
      const discountPercent = Number(rest.discount ?? 0);
      const discountAmount = subtotal * (discountPercent / 100);
      const taxAmount = (subtotal - discountAmount) * (tax / 100);
      updatePayload.subtotal = subtotal;
      updatePayload.tax_amount = taxAmount;
      updatePayload.discount = discountAmount;
      updatePayload.total = subtotal - discountAmount + taxAmount;

      await supabase.from("invoice_items").delete().eq("invoice_id", id);
      await supabase.from("invoice_items").insert(
        list.map((item) => {
          const rate = Number(item.rate ?? item.unitPrice ?? 0);
          const qty = Number(item.quantity ?? 1);
          return {
            invoice_id: id,
            group_name: item.groupName ?? null,
            model: item.model ?? null,
            description: item.description ?? "",
            quantity: qty,
            unit: item.unit ?? "unit",
            rate,
            amount: qty * rate,
          };
        }),
      );
    }

    const { error } = await supabase.from("invoices").update(updatePayload).eq("id", id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return invoices.getOne(id);
  },

  delete: async (id: string) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const { error } = await supabase.from("invoices").delete().eq("id", id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { message: "Invoice deleted" };
  },

  addPayment: async (invoiceId: string, paymentData: Record<string, unknown>) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const { data: inv } = await supabase.from("invoices").select("id").eq("id", invoiceId).eq("user_id", userId).single();
    if (!inv) throw new Error("Invoice not found");
    const { data, error } = await supabase
      .from("payment_records")
      .insert({
        invoice_id: invoiceId,
        amount: paymentData.amount,
        payment_date: paymentData.paymentDate ?? new Date().toISOString(),
        method: paymentData.method,
        reference: paymentData.reference,
        notes: paymentData.notes,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  },

  downloadPDF: async (id: string, invoiceNumber?: string) => {
    const response = await fetch(`/api/invoices/${id}/pdf`);
    if (!response.ok) throw new Error("Failed to download PDF");
    let fileName = `Invoice-${id}.pdf`;
    const cd = response.headers.get("Content-Disposition");
    if (cd) {
      const match = cd.match(/filename="?([^"]+)"?/);
      if (match?.[1]) fileName = match[1];
    } else if (invoiceNumber) {
      fileName = `${invoiceNumber.replace(/\//g, "-")}.pdf`;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },
};

export const quotations = {
  getAll: async (params: Record<string, string> = {}) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    let q = supabase
      .from("quotations")
      .select("*, client:clients(id, name, email), items:quotation_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (params.status) q = q.eq("status", params.status);
    if (params.clientId) q = q.eq("client_id", params.clientId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return toCamel(data ?? []);
  },

  getOne: async (id: string) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("quotations")
      .select("*, client:clients(*), items:quotation_items(*)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  },

  create: async (body: Record<string, unknown>) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const items = body.items as Record<string, unknown>[];
    if (!body.clientId || !items?.length) throw new Error("Client and items are required");

    const settings = await getSettingsRow(userId);
    const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.rate ?? i.unitPrice ?? 0), 0);
    const tax = Number(body.taxRate ?? 11);
    const discountPercent = Number(body.discount ?? 0);
    const discountAmount = subtotal * (discountPercent / 100);
    const taxAmount = (subtotal - discountAmount) * (tax / 100);
    const total = subtotal - discountAmount + taxAmount;

    let nextNum = settings.sph_next_num ?? 1;
    const padding = settings.sph_padding ?? 4;
    const prefix = settings.sph_prefix ?? "SPH/{YYYY}/";
    let quotationNumber = "";
    for (let i = 0; i < 100; i++) {
      quotationNumber = formatDocNumber(prefix, nextNum, padding);
      const { data: existing } = await supabase
        .from("quotations")
        .select("id")
        .eq("quotation_number", quotationNumber)
        .maybeSingle();
      if (!existing) break;
      nextNum++;
    }

    const projectRef = body.projectName || body.poNumber || "";
    const { data: quotation, error } = await supabase
      .from("quotations")
      .insert({
        quotation_number: quotationNumber,
        client_id: body.clientId,
        user_id: userId,
        issue_date: body.issueDate ?? new Date().toISOString(),
        valid_until: body.validUntil ?? new Date(Date.now() + 30 * 86400000).toISOString(),
        project_name: projectRef,
        subtotal,
        tax_rate: tax,
        tax_amount: taxAmount,
        discount: discountAmount,
        total,
        notes: body.notes,
        terms: body.terms,
        bank_account: body.bankAccount,
        signature_name: body.signatureName,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("quotation_items").insert(
      items.map((item) => {
        const rate = Number(item.rate ?? item.unitPrice ?? 0);
        const qty = Number(item.quantity ?? 1);
        return {
          quotation_id: quotation.id,
          group_name: item.groupName ?? null,
          model: item.model ?? null,
          description: item.description ?? "",
          quantity: qty,
          unit: item.unit ?? "unit",
          rate,
          amount: qty * rate,
        };
      }),
    );
    await supabase.from("company_settings").update({ sph_next_num: nextNum + 1 }).eq("user_id", userId);
    return quotations.getOne(quotation.id);
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const { items, poNumber, ...rest } = body;
    const updatePayload: Record<string, unknown> = { ...toSnake(rest as Record<string, unknown>) };
    if (poNumber) updatePayload.project_name = poNumber;

    if (items) {
      const list = items as Record<string, unknown>[];
      const subtotal = list.reduce((s, i) => s + Number(i.quantity ?? 1) * Number(i.rate ?? i.unitPrice ?? 0), 0);
      const tax = Number(rest.taxRate ?? 11);
      const discountPercent = Number(rest.discount ?? 0);
      const discountAmount = subtotal * (discountPercent / 100);
      const taxAmount = (subtotal - discountAmount) * (tax / 100);
      updatePayload.subtotal = subtotal;
      updatePayload.tax_amount = taxAmount;
      updatePayload.discount = discountAmount;
      updatePayload.total = subtotal - discountAmount + taxAmount;

      await supabase.from("quotation_items").delete().eq("quotation_id", id);
      await supabase.from("quotation_items").insert(
        list.map((item) => {
          const rate = Number(item.rate ?? item.unitPrice ?? 0);
          const qty = Number(item.quantity ?? 1);
          return {
            quotation_id: id,
            group_name: item.groupName ?? null,
            model: item.model ?? null,
            description: item.description ?? "",
            quantity: qty,
            unit: item.unit ?? "unit",
            rate,
            amount: qty * rate,
          };
        }),
      );
    }

    const { error } = await supabase.from("quotations").update(updatePayload).eq("id", id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return quotations.getOne(id);
  },

  delete: async (id: string) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const { error } = await supabase.from("quotations").delete().eq("id", id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { message: "Quotation deleted" };
  },

  downloadPDF: async (id: string, quotationNumber?: string) => {
    const response = await fetch(`/api/quotations/${id}/pdf`);
    if (!response.ok) throw new Error("Failed to download PDF");
    let fileName = `Quotation-${id}.pdf`;
    const cd = response.headers.get("Content-Disposition");
    if (cd) {
      const match = cd.match(/filename="?([^"]+)"?/);
      if (match?.[1]) fileName = match[1];
    } else if (quotationNumber) {
      fileName = `${quotationNumber.replace(/\//g, "-")}.pdf`;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },
};

export const settings = {
  get: async () => {
    const userId = await requireUserId();
    const row = await getSettingsRow(userId);
    return mapSettings(row);
  },

  update: async (body: Record<string, unknown>) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const updateData: Record<string, unknown> = {};
    const fields: [string, string][] = [
      ["companyName", "company_name"],
      ["legalName", "legal_name"],
      ["taxId", "tax_id"],
      ["email", "email"],
      ["phone", "phone"],
      ["address", "address"],
      ["city", "city"],
      ["workshop", "workshop"],
      ["logo", "logo"],
      ["signatureImage", "signature_image"],
      ["signatureName", "signature_name"],
      ["quotationPrefix", "quotation_prefix"],
      ["invoicePrefix", "invoice_prefix"],
      ["sphPrefix", "sph_prefix"],
    ];
    for (const [camel, snake] of fields) {
      if (body[camel] !== undefined) updateData[snake] = body[camel];
    }
    if (body.taxName !== undefined || body.defaultTaxName !== undefined) {
      updateData.default_tax_name = body.taxName ?? body.defaultTaxName;
    }
    if (body.taxRate !== undefined || body.defaultTaxRate !== undefined) {
      updateData.default_tax_rate = parseFloat(String(body.taxRate ?? body.defaultTaxRate));
    }
    if (body.quotationNextNum !== undefined) updateData.quotation_next_num = parseInt(String(body.quotationNextNum), 10);
    if (body.invoiceNextNum !== undefined) updateData.invoice_next_num = parseInt(String(body.invoiceNextNum), 10);
    if (body.sphNextNum !== undefined) updateData.sph_next_num = parseInt(String(body.sphNextNum), 10);
    if (body.sphPadding !== undefined) updateData.sph_padding = parseInt(String(body.sphPadding), 10);

    const { error } = await supabase.from("company_settings").update(updateData).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return settings.get();
  },

  getBankAccounts: async () => {
    const s = await settings.get();
    return (s.bankAccounts as unknown[]) ?? [];
  },

  createBankAccount: async (body: Record<string, unknown>) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const row = await getSettingsRow(userId);
    const bankName = body.bankName as string;
    const accountNumber = (body.accountNumber ?? body.accountNum) as string;
    if (!bankName || !accountNumber) throw new Error("Bank name and account number are required");

    if (body.isDefault) {
      await supabase.from("bank_accounts").update({ is_default: false }).eq("settings_id", row.id);
    }

    const { data, error } = await supabase
      .from("bank_accounts")
      .insert({
        settings_id: row.id,
        bank_name: bankName,
        account_num: accountNumber,
        holder_name: (body.accountHolder ?? body.holderName ?? "") as string,
        is_default: Boolean(body.isDefault),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapBankAccount(toCamel(data) as Record<string, unknown>);
  },

  updateBankAccount: async (id: string, body: Record<string, unknown>) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const row = await getSettingsRow(userId);
    const { error } = await supabase
      .from("bank_accounts")
      .update({
        bank_name: body.bankName,
        account_num: body.accountNumber ?? body.accountNum,
        holder_name: body.accountHolder ?? body.holderName,
        is_default: body.isDefault,
      })
      .eq("id", id)
      .eq("settings_id", row.id);
    if (error) throw new Error(error.message);
    return mapBankAccount(toCamel(body) as Record<string, unknown>);
  },

  deleteBankAccount: async (id: string) => {
    const userId = await requireUserId();
    const supabase = getSupabase();
    const row = await getSettingsRow(userId);
    const { error } = await supabase.from("bank_accounts").delete().eq("id", id).eq("settings_id", row.id);
    if (error) throw new Error(error.message);
    return { message: "Bank account deleted successfully" };
  },
};

export default {
  auth,
  clients,
  invoices,
  quotations,
  settings,
  setToken,
  getCurrentUser,
  setCurrentUser,
};
