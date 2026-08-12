import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

/* ------------------------------------------------------------------ */
/* Carrito de cotización (quote en estado draft)                       */
/* ------------------------------------------------------------------ */

export const getMyCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { loadCartContext } = await import("@/lib/quotes.server");
    return loadCartContext(supabase);
  });

export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ product_id: uuid, quantity: z.number().int().min(1).max(9999).default(1) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { ensureDraft, currentDiscount } = await import("@/lib/quotes.server");
    const draftId = await ensureDraft(supabase);
    const discount = await currentDiscount(supabase);

    const { data: product, error } = await supabase
      .from("products")
      .select("id, sku, name, list_price, active")
      .eq("id", data.product_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product || !product.active) throw new Error("Producto no disponible.");

    const unit = Math.round(product.list_price * (1 - discount / 100) * 100) / 100;
    const { data: existing } = await supabase
      .from("quote_items")
      .select("id, quantity")
      .eq("quote_id", draftId)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existing) {
      const { error: e } = await supabase
        .from("quote_items")
        .update({ quantity: existing.quantity + data.quantity, unit_price: unit, list_price: product.list_price })
        .eq("id", existing.id);
      if (e) throw new Error(e.message);
    } else {
      const { error: e } = await supabase.from("quote_items").insert({
        quote_id: draftId,
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        list_price: product.list_price,
        unit_price: unit,
        quantity: data.quantity,
      } as never);
      if (e) throw new Error(e.message);
    }
    const { recalcQuote } = await import("@/lib/quotes.server");
    await recalcQuote(supabase, draftId);
    return { ok: true };
  });

export const updateCartItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ item_id: uuid, quantity: z.number().int().min(0).max(9999) }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: item, error } = await supabase
      .from("quote_items")
      .select("id, quote_id")
      .eq("id", data.item_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!item) throw new Error("Partida no encontrada.");

    if (data.quantity === 0) {
      const { error: e } = await supabase.from("quote_items").delete().eq("id", item.id);
      if (e) throw new Error(e.message);
    } else {
      const { error: e } = await supabase
        .from("quote_items")
        .update({ quantity: data.quantity })
        .eq("id", item.id);
      if (e) throw new Error(e.message);
    }
    const { recalcQuote } = await import("@/lib/quotes.server");
    await recalcQuote(supabase, item.quote_id);
    return { ok: true };
  });

export const clearCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { findDraft, recalcQuote } = await import("@/lib/quotes.server");
    const draftId = await findDraft(supabase);
    if (!draftId) return { ok: true };
    const { error } = await supabase.from("quote_items").delete().eq("quote_id", draftId);
    if (error) throw new Error(error.message);
    await recalcQuote(supabase, draftId);
    return { ok: true };
  });

export const submitQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ comments: z.string().max(1000).optional().default("") }).parse(data ?? {}))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { findDraft, recalcQuote } = await import("@/lib/quotes.server");
    const draftId = await findDraft(supabase);
    if (!draftId) throw new Error("Tu cotización está vacía.");

    const { count } = await supabase
      .from("quote_items")
      .select("id", { count: "exact", head: true })
      .eq("quote_id", draftId);
    if (!count) throw new Error("Agrega al menos un producto antes de enviar.");

    await recalcQuote(supabase, draftId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: folioRes, error: folioErr } = await supabaseAdmin.rpc("next_folio", { _prefix: "COT" });
    if (folioErr) throw new Error(folioErr.message);

    const { data: quote, error } = await supabase
      .from("quotes")
      .update({
        status: "pending",
        folio: folioRes as unknown as string,
        comments: data.comments || null,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", draftId)
      .select("id, folio, distributor_id, seller_id, total")
      .single();
    if (error) throw new Error(error.message);

    const { notifyQuoteSubmitted } = await import("@/lib/quotes.server");
    const email = await notifyQuoteSubmitted(supabaseAdmin, quote.id);
    return { ok: true, folio: quote.folio, email };
  });

/* ------------------------------------------------------------------ */
/* Consultas                                                           */
/* ------------------------------------------------------------------ */

export const listMyQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quotes")
      .select("id, folio, status, total, subtotal_list, discount_amount, created_at, submitted_at, items:quote_items(id)")
      .neq("status", "draft")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { quotes: data ?? [] };
  });

export const getQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: uuid }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: quote, error } = await context.supabase
      .from("quotes")
      .select(
        "*, distributor:distributors(company, contact_name, email, phone, level_code), seller:sellers(name, email, whatsapp), items:quote_items(*)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!quote) throw new Error("Cotización no encontrada.");
    return { quote };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, folio, status, total, created_at, updated_at, quote_id, items:order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

/* ------------------------------------------------------------------ */
/* Gestión interna (admin / vendedor)                                  */
/* ------------------------------------------------------------------ */

export const staffListQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: quotes, error }, { data: orders }] = await Promise.all([
      context.supabase
        .from("quotes")
        .select(
          "*, distributor:distributors(id, company, contact_name, email, phone), seller:sellers(name), items:quote_items(*)",
        )
        .neq("status", "draft")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("orders")
        .select("*, distributor:distributors(id, company, contact_name, email), items:order_items(*)")
        .order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    return { quotes: quotes ?? [], orders: orders ?? [] };
  });

export const staffSetQuoteStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: uuid,
        status: z.enum(["in_review", "approved", "confirmed", "rejected", "cancelled"]),
        internal_notes: z.string().max(1000).optional().nullable(),
        items: z
          .array(z.object({ id: uuid, quantity: z.number().int().min(1), unit_price: z.number().min(0) }))
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertStaff, recalcQuote, notifyQuoteStatus } = await import("@/lib/quotes.server");
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.items?.length) {
      for (const item of data.items) {
        const { error } = await supabaseAdmin
          .from("quote_items")
          .update({ quantity: item.quantity, unit_price: item.unit_price })
          .eq("id", item.id);
        if (error) throw new Error(error.message);
      }
      await recalcQuote(supabaseAdmin, data.id);
    }

    const { error } = await supabaseAdmin
      .from("quotes")
      .update({ status: data.status, internal_notes: data.internal_notes ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    let orderFolio: string | null = null;
    if (data.status === "confirmed") {
      const { createOrderFromQuote } = await import("@/lib/quotes.server");
      orderFolio = await createOrderFromQuote(supabaseAdmin, data.id);
    }
    const email = await notifyQuoteStatus(supabaseAdmin, data.id, data.status, orderFolio);
    return { ok: true, orderFolio, email };
  });

export const staffSetOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: uuid,
        status: z.enum([
          "received",
          "in_review",
          "availability_confirmed",
          "approved",
          "preparing",
          "shipped",
          "delivered",
          "rejected",
          "cancelled",
        ]),
        notes: z.string().max(1000).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertStaff, notifyOrderStatus } = await import("@/lib/quotes.server");
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.status === "approved") {
      const { error } = await supabaseAdmin.rpc("approve_order", { _order_id: data.id });
      if (error) throw new Error(error.message);
    }
    const patch: Record<string, unknown> = { status: data.status };
    if (data.notes !== undefined) patch["notes"] = data.notes;
    const { error } = await supabaseAdmin.from("orders").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);

    const email = await notifyOrderStatus(supabaseAdmin, data.id, data.status);
    return { ok: true, email };
  });

/** Ajuste de partidas por el vendedor: cantidades, precios y eliminación. */
export const staffUpdateQuoteItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: uuid,
        items: z.array(
          z.object({
            id: uuid,
            quantity: z.number().int().min(1),
            unit_price: z.number().min(0),
            remove: z.boolean().optional(),
          }),
        ),
        internal_notes: z.string().max(1000).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertStaff, recalcQuote } = await import("@/lib/quotes.server");
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (const item of data.items) {
      if (item.remove) {
        const { error } = await supabaseAdmin.from("quote_items").delete().eq("id", item.id);
        if (error) throw new Error(error.message);
        continue;
      }
      const { error } = await supabaseAdmin
        .from("quote_items")
        .update({ quantity: item.quantity, unit_price: item.unit_price })
        .eq("id", item.id);
      if (error) throw new Error(error.message);
    }
    await recalcQuote(supabaseAdmin, data.id);
    if (data.internal_notes !== undefined) {
      const { error } = await supabaseAdmin
        .from("quotes")
        .update({ internal_notes: data.internal_notes })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
