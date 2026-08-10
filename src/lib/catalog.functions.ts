import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

/* ------------------------------------------------------------------ */
/* Distributor-facing catalog                                          */
/* ------------------------------------------------------------------ */

export const getCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        search: z.string().optional().default(""),
        brand_id: z.string().optional().nullable(),
        category_id: z.string().optional().nullable(),
        sort: z
          .enum(["manual", "price_asc", "price_desc", "name_asc", "name_desc", "newest", "top", "featured"])
          .optional()
          .default("manual"),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { signMedia, resolveMedia } = await import("@/lib/media.server");

    let query = supabase
      .from("products")
      .select(
        "id, sku, name, short_description, list_price, stock_status, main_image, is_new, featured, times_quoted, created_at, sort_order, brand:brands(id, name), category:categories!products_category_id_fkey(id, name)",
      )
      .eq("active", true)
      .limit(300);

    if (data.search.trim()) {
      const term = `%${data.search.trim()}%`;
      query = query.or(`name.ilike.${term},sku.ilike.${term}`);
    }
    if (data.brand_id) query = query.eq("brand_id", data.brand_id);
    if (data.category_id) query = query.eq("category_id", data.category_id);

    switch (data.sort) {
      case "price_asc":
        query = query.order("list_price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("list_price", { ascending: false });
        break;
      case "name_asc":
        query = query.order("name", { ascending: true });
        break;
      case "name_desc":
        query = query.order("name", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "top":
        query = query.order("times_quoted", { ascending: false });
        break;
      case "featured":
        query = query.order("featured", { ascending: false }).order("sort_order");
        break;
      default:
        query = query.order("sort_order").order("name");
    }

    const [{ data: products, error }, { data: brands }, { data: categories }, { data: banners }] =
      await Promise.all([
        query,
        supabase.from("brands").select("*").eq("active", true).order("sort_order").order("name"),
        supabase.from("categories").select("*").eq("active", true).order("sort_order").order("name"),
        supabase.from("banners").select("*").eq("active", true).order("sort_order"),
      ]);
    if (error) throw new Error(error.message);

    const map = await signMedia(supabase, [
      ...(products ?? []).map((p) => p.main_image),
      ...(brands ?? []).map((b) => b.logo_url),
      ...(banners ?? []).map((b) => b.image_url),
    ]);

    return {
      products: (products ?? []).map((p) => ({ ...p, main_image: resolveMedia(p.main_image, map) })),
      brands: (brands ?? []).map((b) => ({ ...b, logo_url: resolveMedia(b.logo_url, map) })),
      categories: categories ?? [],
      banners: (banners ?? []).map((b) => ({ ...b, image_url: resolveMedia(b.image_url, map) })),
    };
  });

export const getProductDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: uuid }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { signMedia, resolveMedia } = await import("@/lib/media.server");
    const { data: product, error } = await supabase
      .from("products")
      .select(
        "*, brand:brands(id, name, logo_url), category:categories!products_category_id_fkey(id, name), subcategory:categories!products_subcategory_id_fkey(id, name), images:product_images(id, url, alt, sort_order)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) throw new Error("Producto no disponible.");

    const images = [...((product.images ?? []) as Array<{ url: string; sort_order: number; id: string }>)].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const map = await signMedia(supabase, [product.main_image, ...images.map((i) => i.url)]);

    return {
      product: {
        ...product,
        stock: undefined,
        main_image: resolveMedia(product.main_image, map),
        images: images.map((i) => ({ ...i, url: resolveMedia(i.url, map) })),
      },
    };
  });

/* ------------------------------------------------------------------ */
/* Admin: products                                                     */
/* ------------------------------------------------------------------ */

export const adminListCatalogData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { signMedia, resolveMedia } = await import("@/lib/media.server");

    const [products, brands, categories, banners, promotions, settings, sections, items] =
      await Promise.all([
        supabaseAdmin
          .from("products")
          .select("*, brand:brands(id, name), category:categories!products_category_id_fkey(id, name)")
          .order("updated_at", { ascending: false })
          .limit(1000),
        supabaseAdmin.from("brands").select("*").order("sort_order").order("name"),
        supabaseAdmin.from("categories").select("*").order("sort_order").order("name"),
        supabaseAdmin.from("banners").select("*").order("sort_order"),
        supabaseAdmin.from("promotions").select("*").order("sort_order"),
        supabaseAdmin.from("app_settings").select("*"),
        supabaseAdmin.from("catalog_sections").select("*").order("sort_order"),
        supabaseAdmin.from("catalog_items").select("*").order("sort_order"),
      ]);

    const map = await signMedia(context.supabase, [
      ...(products.data ?? []).map((p) => p.main_image),
      ...(brands.data ?? []).map((b) => b.logo_url),
      ...(banners.data ?? []).map((b) => b.image_url),
    ]);

    return {
      products: (products.data ?? []).map((p) => ({
        ...p,
        main_image_url: resolveMedia(p.main_image, map),
      })),
      brands: (brands.data ?? []).map((b) => ({ ...b, logo_display: resolveMedia(b.logo_url, map) })),
      categories: categories.data ?? [],
      banners: (banners.data ?? []).map((b) => ({ ...b, image_display: resolveMedia(b.image_url, map) })),
      promotions: promotions.data ?? [],
      settings: settings.data ?? [],
      sections: sections.data ?? [],
      items: items.data ?? [],
    };
  });

const productSchema = z.object({
  id: uuid.optional().nullable(),
  sku: z.string().min(1, "El SKU es obligatorio"),
  name: z.string().min(2, "El nombre es obligatorio"),
  brand_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  subcategory_id: z.string().uuid().nullable().optional(),
  list_price: z.number().min(0),
  stock: z.number().int().min(0).default(0),
  stock_status: z.enum(["available", "low", "inquire", "out"]).default("available"),
  short_description: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  features: z.array(z.string()).default([]),
  specs: z.record(z.string(), z.string()).default({}),
  extra_info: z.string().nullable().optional(),
  main_image: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  is_new: z.boolean().default(false),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  images: z
    .array(z.object({ url: z.string().min(1), alt: z.string().nullable().optional() }))
    .default([]),
});

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => productSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { images, id, ...rest } = data;
    const row = {
      ...rest,
      sku: rest.sku.trim().toUpperCase(),
      brand_id: rest.brand_id || null,
      category_id: rest.category_id || null,
      subcategory_id: rest.subcategory_id || null,
    };

    const dup = await supabaseAdmin.from("products").select("id").eq("sku", row.sku).maybeSingle();
    if (dup.data && dup.data.id !== id) {
      throw new Error(`El SKU ${row.sku} ya pertenece a otro producto.`);
    }

    let productId = id ?? null;
    if (productId) {
      const { error } = await supabaseAdmin.from("products").update(row as never).eq("id", productId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("products")
        .insert(row as never)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      productId = created.id;
    }

    await supabaseAdmin.from("product_images").delete().eq("product_id", productId!);
    if (images.length) {
      const { error } = await supabaseAdmin.from("product_images").insert(
        images.map((img, i) => ({
          product_id: productId!,
          url: img.url,
          alt: img.alt ?? null,
          sort_order: i,
        })) as never,
      );
      if (error) throw new Error(error.message);
    }
    return { ok: true, id: productId };
  });

export const adminProductAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: uuid,
        action: z.enum(["duplicate", "toggle", "delete"]),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) throw new Error("Producto no encontrado.");

    if (data.action === "toggle") {
      const { error: e } = await supabaseAdmin
        .from("products")
        .update({ active: !product.active })
        .eq("id", data.id);
      if (e) throw new Error(e.message);
      return { ok: true };
    }

    if (data.action === "delete") {
      const used = await supabaseAdmin
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .eq("product_id", data.id);
      if ((used.count ?? 0) > 0) {
        throw new Error(
          "Este producto tiene pedidos asociados. Desactívalo en lugar de eliminarlo para conservar el historial.",
        );
      }
      const { error: e } = await supabaseAdmin.from("products").delete().eq("id", data.id);
      if (e) throw new Error(e.message);
      return { ok: true };
    }

    const copy = {
      ...product,
      id: undefined,
      sku: `${product.sku}-COPIA`,
      name: `${product.name} (copia)`,
      active: false,
      created_at: undefined,
      updated_at: undefined,
      times_quoted: 0,
    };
    delete (copy as Record<string, unknown>)["id"];
    delete (copy as Record<string, unknown>)["created_at"];
    delete (copy as Record<string, unknown>)["updated_at"];
    const { data: created, error: e2 } = await supabaseAdmin
      .from("products")
      .insert(copy as never)
      .select("id")
      .single();
    if (e2) throw new Error(e2.message);
    const { data: imgs } = await supabaseAdmin
      .from("product_images")
      .select("url, alt, sort_order")
      .eq("product_id", data.id);
    if (imgs?.length) {
      await supabaseAdmin
        .from("product_images")
        .insert(imgs.map((i) => ({ ...i, product_id: created.id })) as never);
    }
    return { ok: true, id: created.id };
  });

export const adminGetProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: uuid }).parse(data))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { signMedia, resolveMedia } = await import("@/lib/media.server");
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("*, images:product_images(id, url, alt, sort_order)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) throw new Error("Producto no encontrado.");
    const images = [...((product.images ?? []) as Array<{ url: string; sort_order: number }>)].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const map = await signMedia(context.supabase, [product.main_image, ...images.map((i) => i.url)]);
    return {
      product: {
        ...product,
        main_image_url: resolveMedia(product.main_image, map),
        images: images.map((i) => ({ ...i, display: resolveMedia(i.url, map) })),
      },
    };
  });

export const adminSetStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: uuid,
        stock: z.number().int().min(0).optional(),
        stock_status: z.enum(["available", "low", "inquire", "out"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.stock !== undefined) patch["stock"] = data.stock;
    if (data.stock_status) patch["stock_status"] = data.stock_status;
    const { error } = await supabaseAdmin.from("products").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Admin: brands / categories / banners / promotions / settings        */
/* ------------------------------------------------------------------ */

export const adminSaveEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        table: z.enum(["brands", "categories", "banners", "promotions", "catalog_sections", "catalog_items"]),
        id: uuid.optional().nullable(),
        values: z.record(z.string(), z.unknown()),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = data.id
      ? await supabaseAdmin.from(data.table).update(data.values as never).eq("id", data.id)
      : await supabaseAdmin.from(data.table).insert(data.values as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        table: z.enum(["brands", "categories", "banners", "promotions", "catalog_sections", "catalog_items"]),
        id: uuid,
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReorder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        table: z.enum(["brands", "categories", "banners", "promotions", "catalog_sections", "catalog_items", "products"]),
        ids: z.array(uuid),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await supabaseAdmin
        .from(data.table)
        .update({ sort_order: i } as never)
        .eq("id", data.ids[i]!);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminSaveInventoryThresholds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ available_min: z.number().int().min(1), low_min: z.number().int().min(0) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.available_min <= data.low_min) {
      throw new Error("El mínimo de 'Disponible' debe ser mayor que el de 'Bajo inventario'.");
    }
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: "inventory_thresholds", value: data } as never, { onConflict: "key" });
    if (error) throw new Error(error.message);
    // Recalcula el estado de todos los productos con el nuevo rango
    const { data: products } = await supabaseAdmin.from("products").select("id, stock, stock_status");
    for (const p of products ?? []) {
      if (p.stock_status === "inquire") continue;
      await supabaseAdmin.from("products").update({ stock: p.stock }).eq("id", p.id);
    }
    return { ok: true };
  });
