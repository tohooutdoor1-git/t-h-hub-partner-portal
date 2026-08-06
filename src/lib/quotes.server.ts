import type { SupabaseClient } from "@supabase/supabase-js";

type DB = SupabaseClient<any, any, any>;

export async function assertStaff(supabase: DB, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "seller"]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Acción reservada al equipo TÖHÖ.");
  return true;
}

export async function currentDiscount(supabase: DB) {
  const { data, error } = await supabase.rpc("my_discount_pct");
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

async function myDistributor(supabase: DB) {
  const { data, error } = await supabase
    .from("distributors")
    .select("id, seller_id, level_code")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Tu cuenta aún no está vinculada a un distribuidor.");
  return data;
}

export async function findDraft(supabase: DB): Promise<string | null> {
  const { data, error } = await supabase
    .from("quotes")
    .select("id")
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

export async function ensureDraft(supabase: DB): Promise<string> {
  const existing = await findDraft(supabase);
  if (existing) return existing;
  const dist = await myDistributor(supabase);
  const discount = await currentDiscount(supabase);
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      folio: `BORRADOR-${Date.now()}`,
      distributor_id: dist.id,
      seller_id: dist.seller_id,
      level_code: dist.level_code,
      discount_pct: discount,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function recalcQuote(supabase: DB, quoteId: string) {
  const { data: items, error } = await supabase
    .from("quote_items")
    .select("list_price, unit_price, quantity")
    .eq("quote_id", quoteId);
  if (error) throw new Error(error.message);
  const subtotal = (items ?? []).reduce(
    (s: number, i: { list_price: number; quantity: number }) => s + Number(i.list_price) * i.quantity,
    0,
  );
  const total = (items ?? []).reduce(
    (s: number, i: { unit_price: number; quantity: number }) => s + Number(i.unit_price) * i.quantity,
    0,
  );
  const { error: e } = await supabase
    .from("quotes")
    .update({
      subtotal_list: Math.round(subtotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      discount_amount: Math.round((subtotal - total) * 100) / 100,
    })
    .eq("id", quoteId);
  if (e) throw new Error(e.message);
}

export async function loadCartContext(supabase: DB) {
  const draftId = await findDraft(supabase);
  if (!draftId) return { quote: null, items: [], discount_pct: await currentDiscount(supabase) };
  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", draftId).maybeSingle(),
    supabase
      .from("quote_items")
      .select("*, product:products(main_image, stock_status, active)")
      .eq("quote_id", draftId)
      .order("created_at"),
  ]);
  const { signMedia, resolveMedia } = await import("@/lib/media.server");
  const map = await signMedia(
    supabase,
    (items ?? []).map((i: { product?: { main_image?: string | null } | null }) => i.product?.main_image ?? null),
  );
  return {
    quote,
    discount_pct: Number(quote?.discount_pct ?? 0),
    items: (items ?? []).map((i: Record<string, any>) => ({
      ...i,
      image: resolveMedia(i["product"]?.main_image ?? null, map),
    })),
  };
}

export async function createOrderFromQuote(admin: DB, quoteId: string) {
  const { data: quote, error } = await admin
    .from("quotes")
    .select("*, items:quote_items(*)")
    .eq("id", quoteId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!quote) throw new Error("Cotización no encontrada.");

  const existing = await admin.from("orders").select("folio").eq("quote_id", quoteId).maybeSingle();
  if (existing.data) return existing.data.folio as string;

  const { data: folio, error: fe } = await admin.rpc("next_folio", { _prefix: "PED" });
  if (fe) throw new Error(fe.message);

  const { data: order, error: oe } = await admin
    .from("orders")
    .insert({
      folio,
      quote_id: quoteId,
      distributor_id: quote.distributor_id,
      seller_id: quote.seller_id,
      status: "received",
      total: quote.total,
    })
    .select("id, folio")
    .single();
  if (oe) throw new Error(oe.message);

  const items = (quote.items ?? []) as Array<Record<string, any>>;
  if (items.length) {
    const { error: ie } = await admin.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i["product_id"],
        sku: i["sku"],
        name: i["name"],
        list_price: i["list_price"],
        unit_price: i["unit_price"],
        quantity: i["quantity"],
      })),
    );
    if (ie) throw new Error(ie.message);
    for (const i of items) {
      if (!i["product_id"]) continue;
      const { data: p } = await admin
        .from("products")
        .select("times_quoted")
        .eq("id", i["product_id"])
        .maybeSingle();
      await admin
        .from("products")
        .update({ times_quoted: Number(p?.times_quoted ?? 0) + 1 })
        .eq("id", i["product_id"]);
    }
  }
  return order.folio as string;
}

/* ------------------------- Notificaciones ------------------------- */

async function notify(admin: DB, userIds: Array<string | null | undefined>, title: string, body: string) {
  const rows = userIds
    .filter((id): id is string => Boolean(id))
    .map((user_id) => ({ user_id, title, body, channel: "app" }));
  if (rows.length) await admin.from("notifications").insert(rows);
}

async function quoteParties(admin: DB, quoteId: string) {
  const { data } = await admin
    .from("quotes")
    .select(
      "folio, total, distributor:distributors(user_id, company, email), seller:sellers(user_id, name, email)",
    )
    .eq("id", quoteId)
    .maybeSingle();
  const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  return { quote: data as any, adminIds: (admins ?? []).map((a: { user_id: string }) => a.user_id) };
}

export async function notifyQuoteSubmitted(admin: DB, quoteId: string) {
  const { quote, adminIds } = await quoteParties(admin, quoteId);
  if (!quote) return { sent: false, reason: "not_found" as const };
  const title = `Nueva cotización ${quote.folio}`;
  const body = `${quote.distributor?.company ?? "Distribuidor"} envió la cotización ${quote.folio}.`;
  await notify(admin, [quote.seller?.user_id, ...adminIds], title, body);
  const { sendHubEmail } = await import("@/lib/email.server");
  return sendHubEmail([quote.seller?.email, quote.distributor?.email], title, body);
}

export async function notifyQuoteStatus(
  admin: DB,
  quoteId: string,
  status: string,
  orderFolio: string | null,
) {
  const { quote } = await quoteParties(admin, quoteId);
  if (!quote) return { sent: false, reason: "not_found" as const };
  const labels: Record<string, string> = {
    in_review: "está en revisión",
    approved: "fue aprobada",
    confirmed: "fue confirmada",
    rejected: "fue rechazada",
    cancelled: "fue cancelada",
  };
  const title = `Cotización ${quote.folio} ${labels[status] ?? "actualizada"}`;
  const body = orderFolio
    ? `Tu cotización ${quote.folio} se convirtió en el pedido ${orderFolio}.`
    : `Tu cotización ${quote.folio} ${labels[status] ?? "cambió de estado"}.`;
  await notify(admin, [quote.distributor?.user_id], title, body);
  const { sendHubEmail } = await import("@/lib/email.server");
  return sendHubEmail([quote.distributor?.email], title, body);
}

export async function notifyOrderStatus(admin: DB, orderId: string, status: string) {
  const { data: order } = await admin
    .from("orders")
    .select("folio, distributor:distributors(user_id, email)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { sent: false, reason: "not_found" as const };
  const dist = (order as any).distributor;
  const title = `Pedido ${order.folio} actualizado`;
  const body = `Tu pedido ${order.folio} cambió a: ${status}.`;
  await notify(admin, [dist?.user_id], title, body);
  const { sendHubEmail } = await import("@/lib/email.server");
  return sendHubEmail([dist?.email], title, body);
}
