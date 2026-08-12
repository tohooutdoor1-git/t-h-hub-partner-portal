import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

/** Recursos comerciales (fichas, catálogos, manuales) agrupados por categoría. */
export const listResources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: categories }, { data: resources }] = await Promise.all([
      supabase.from("resource_categories").select("*").order("sort_order"),
      supabase.from("resources").select("*").eq("active", true).order("created_at", { ascending: false }),
    ]);
    const { signMedia, resolveMedia } = await import("@/lib/media.server");
    const map = await signMedia(
      supabase,
      (resources ?? []).flatMap((r: Record<string, any>) => [r["file_url"], r["thumbnail_url"]]),
    );
    return {
      categories: categories ?? [],
      resources: (resources ?? []).map((r: Record<string, any>) => ({
        ...r,
        file_url: resolveMedia(r["file_url"], map) ?? r["file_url"],
        thumbnail_url: resolveMedia(r["thumbnail_url"], map),
      })),
    };
  });

/** Promociones vigentes con su producto asociado. */
export const listPromotions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const nowIso = new Date().toISOString();
    const [{ data: promotions }, { data: dist }] = await Promise.all([
      supabase
        .from("promotions")
        .select(
          "*, product:products(id, sku, name, short_description, list_price, stock_status, main_image, is_new, featured, brand:brands(id, name), category:categories!products_category_id_fkey(id, name))",
        )
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("distributors")
        .select("level:level_settings(discount_pct)")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    const live = (promotions ?? []).filter((p: Record<string, any>) => {
      const startsOk = !p["starts_at"] || p["starts_at"] <= nowIso;
      const endsOk = !p["ends_at"] || p["ends_at"] >= nowIso;
      return startsOk && endsOk;
    });
    const { signMedia, resolveMedia } = await import("@/lib/media.server");
    const map = await signMedia(
      supabase,
      live.flatMap((p: Record<string, any>) => [p["image_url"], p["product"]?.main_image]),
    );
    return {
      discount_pct: Number((dist as any)?.level?.discount_pct ?? 0),
      promotions: live.map((p: Record<string, any>) => ({
        ...p,
        image_url: resolveMedia(p["image_url"], map),
        product: p["product"]
          ? { ...p["product"], main_image: resolveMedia(p["product"].main_image, map) }
          : null,
      })),
    };
  });

/** Productos marcados como favoritos por el distribuidor actual. */
export const listFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: dist } = await supabase
      .from("distributors")
      .select("id, level:level_settings(discount_pct)")
      .eq("user_id", userId)
      .maybeSingle();
    if (!dist) return { discount_pct: 0, favorites: [] };
    const { data } = await supabase
      .from("favorites")
      .select(
        "id, created_at, product:products(id, sku, name, short_description, list_price, stock_status, main_image, is_new, featured, brand:brands(id, name), category:categories!products_category_id_fkey(id, name))",
      )
      .eq("distributor_id", (dist as any).id)
      .order("created_at", { ascending: false });
    const rows = (data ?? []).filter((f: Record<string, any>) => f["product"]);
    const { signMedia, resolveMedia } = await import("@/lib/media.server");
    const map = await signMedia(
      supabase,
      rows.map((f: Record<string, any>) => f["product"]?.main_image),
    );
    return {
      discount_pct: Number((dist as any)?.level?.discount_pct ?? 0),
      favorites: rows.map((f: Record<string, any>) => ({
        favorite_id: f["id"],
        ...f["product"],
        main_image: resolveMedia(f["product"].main_image, map),
      })),
    };
  });

/** Agrega o quita un producto de favoritos. */
export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ product_id: uuid }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: dist } = await supabase
      .from("distributors")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!dist) throw new Error("Tu usuario no está vinculado a un distribuidor.");
    const distributorId = (dist as any).id as string;
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("distributor_id", distributorId)
      .eq("product_id", data.product_id)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from("favorites").delete().eq("id", (existing as any).id);
      if (error) throw new Error(error.message);
      return { favorited: false };
    }
    const { error } = await supabase
      .from("favorites")
      .insert({ distributor_id: distributorId, product_id: data.product_id });
    if (error) throw new Error(error.message);
    return { favorited: true };
  });
