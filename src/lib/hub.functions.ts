import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: roles }, { data: profile }, { data: distributor }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("distributors")
        .select("*, level:level_settings(*), seller:sellers(*)")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    const { data: levels } = await supabase
      .from("level_settings")
      .select("*")
      .order("sort_order");
    return {
      userId,
      roles: (roles ?? []).map((r) => r.role as string),
      profile: profile ?? null,
      distributor: distributor ?? null,
      levels: levels ?? [],
    };
  });

export const getDistributorDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: quotes }, { data: orders }, { data: promotions }] = await Promise.all([
      supabase
        .from("quotes")
        .select("id, folio, status, total, created_at, quote_items(count)")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("orders")
        .select("id, folio, status, total, created_at, order_items(count)")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("promotions")
        .select("*, product:products(id, name, sku, list_price, main_image, brand:brands(name))")
        .eq("active", true)
        .order("sort_order")
        .limit(6),
    ]);
    return { quotes: quotes ?? [], orders: orders ?? [], promotions: promotions ?? [] };
  });

export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Ya existe un administrador en TÖHÖ HUB.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListDistributors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: distributors }, { data: sellers }, { data: levels }] = await Promise.all([
      supabaseAdmin
        .from("distributors")
        .select("*, level:level_settings(*), seller:sellers(*)")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("sellers").select("*").order("name"),
      supabaseAdmin.from("level_settings").select("*").order("sort_order"),
    ]);
    return { distributors: distributors ?? [], sellers: sellers ?? [], levels: levels ?? [] };
  });

export const adminCreateDistributor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        contact_name: z.string().min(2),
        company: z.string().min(2),
        rfc: z.string().optional().nullable(),
        email: z.string().email(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        level_code: z.string(),
        seller_id: z.string().uuid().optional().nullable(),
        password: z.string().min(8),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.contact_name },
    });
    if (created.error) throw new Error(created.error.message);
    const newUserId = created.data.user!.id;
    await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: "distributor" });
    const { error } = await supabaseAdmin.from("distributors").insert({
      user_id: newUserId,
      contact_name: data.contact_name,
      company: data.company,
      rfc: data.rfc ?? null,
      email: data.email,
      phone: data.phone ?? null,
      address: data.address ?? null,
      level_code: data.level_code,
      seller_id: data.seller_id || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateDistributor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        level_code: z.string().optional(),
        seller_id: z.string().uuid().nullable().optional(),
        active: z.boolean().optional(),
        password: z.string().min(8).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.level_code) patch["level_code"] = data.level_code;
    if (data.seller_id !== undefined) patch["seller_id"] = data.seller_id;
    if (data.active !== undefined) patch["active"] = data.active;
    if (Object.keys(patch).length) {
      const { error } = await supabaseAdmin
        .from("distributors")
        .update(patch as never)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    if (data.password) {
      const { data: row } = await supabaseAdmin
        .from("distributors")
        .select("user_id")
        .eq("id", data.id)
        .maybeSingle();
      if (row?.user_id) {
        const res = await supabaseAdmin.auth.admin.updateUserById(row.user_id, {
          password: data.password,
        });
        if (res.error) throw new Error(res.error.message);
      }
    }
    return { ok: true };
  });

export const adminSaveSeller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(2),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        whatsapp: z.string().optional().nullable(),
        active: z.boolean().default(true),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      whatsapp: data.whatsapp ?? null,
      active: data.active,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("sellers").update(row).eq("id", data.id)
      : await supabaseAdmin.from("sellers").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveLevel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        code: z.string(),
        discount_pct: z.number().min(0).max(100),
        threshold: z.number().min(0),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("level_settings")
      .update({ discount_pct: data.discount_pct, threshold: data.threshold })
      .eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { exists: (count ?? 0) > 0 };
});

export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        full_name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("TÖHÖ HUB ya está configurado.");
    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (created.error) throw new Error(created.error.message);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.data.user!.id, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
