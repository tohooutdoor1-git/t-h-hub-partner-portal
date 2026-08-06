import type { SupabaseClient } from "@supabase/supabase-js";

type DB = SupabaseClient<any, any, any>;
type Row = Record<string, string | number | boolean | null>;

export type ImportIssue = { row: number; sku: string; message: string };
export type ImportResult = {
  ok: boolean;
  dryRun: boolean;
  created: number;
  updated: number;
  skipped: number;
  issues: ImportIssue[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function str(row: Row, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function num(row: Row, ...keys: string[]) {
  const raw = str(row, ...keys).replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function bool(row: Row, ...keys: string[]) {
  const raw = str(row, ...keys).toLowerCase();
  if (!raw) return undefined;
  return ["si", "sí", "true", "1", "x", "yes"].includes(raw);
}

async function resolveRef(db: DB, table: "brands" | "categories", name: string, cache: Map<string, string>) {
  const key = `${table}:${name.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { data } = await db.from(table).select("id").ilike("name", name).maybeSingle();
  if (data) {
    cache.set(key, data.id);
    return data.id as string;
  }
  const { data: created, error } = await db
    .from(table)
    .insert({ name, slug: slugify(name) })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear ${table === "brands" ? "la marca" : "la categoría"} "${name}": ${error.message}`);
  cache.set(key, created.id);
  return created.id as string;
}

export async function runImport(
  db: DB,
  mode: "products" | "stock" | "prices",
  rows: Row[],
  dryRun: boolean,
): Promise<ImportResult> {
  const issues: ImportIssue[] = [];
  const cache = new Map<string, string>();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const seen = new Set<string>();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]!;
    const line = index + 2;
    const sku = str(row, "sku", "SKU", "Sku", "clave", "Clave").toUpperCase();

    if (!sku) {
      issues.push({ row: line, sku: "", message: "Falta el SKU." });
      skipped++;
      continue;
    }
    if (seen.has(sku)) {
      issues.push({ row: line, sku, message: "SKU duplicado dentro del archivo." });
      skipped++;
      continue;
    }
    seen.add(sku);

    const { data: existing } = await db.from("products").select("id").eq("sku", sku).maybeSingle();

    if (mode !== "products") {
      if (!existing) {
        issues.push({ row: line, sku, message: "El SKU no existe en el catálogo." });
        skipped++;
        continue;
      }
      const patch: Record<string, unknown> = {};
      if (mode === "stock") {
        const stock = num(row, "stock", "Stock", "existencia", "Existencia", "inventario");
        if (stock === null || stock < 0) {
          issues.push({ row: line, sku, message: "Inventario inválido." });
          skipped++;
          continue;
        }
        patch["stock"] = Math.round(stock);
      } else {
        const price = num(row, "list_price", "precio", "Precio", "precio_lista", "Precio de lista");
        if (price === null || price < 0) {
          issues.push({ row: line, sku, message: "Precio inválido." });
          skipped++;
          continue;
        }
        patch["list_price"] = price;
      }
      if (!dryRun) {
        const { error } = await db.from("products").update(patch).eq("id", existing.id);
        if (error) {
          issues.push({ row: line, sku, message: error.message });
          skipped++;
          continue;
        }
      }
      updated++;
      continue;
    }

    const name = str(row, "name", "nombre", "Nombre", "producto", "Producto");
    const price = num(row, "list_price", "precio", "Precio", "precio_lista", "Precio de lista");
    if (!name) {
      issues.push({ row: line, sku, message: "Falta el nombre del producto." });
      skipped++;
      continue;
    }
    if (price === null || price < 0) {
      issues.push({ row: line, sku, message: "Precio de lista inválido." });
      skipped++;
      continue;
    }

    const brandName = str(row, "brand", "marca", "Marca");
    const categoryName = str(row, "category", "categoria", "categoría", "Categoría", "Categoria");
    const subcategoryName = str(row, "subcategory", "subcategoria", "subcategoría", "Subcategoría");
    const stock = num(row, "stock", "Stock", "existencia", "inventario") ?? 0;
    const featuresRaw = str(row, "features", "caracteristicas", "características", "Características");
    const specsRaw = str(row, "specs", "especificaciones", "Especificaciones");

    const specs: Record<string, string> = {};
    specsRaw
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((pair) => {
        const [k, ...rest] = pair.split(":");
        if (k && rest.length) specs[k.trim()] = rest.join(":").trim();
      });

    const payload: Record<string, unknown> = {
      sku,
      name,
      list_price: price,
      stock: Math.max(0, Math.round(stock)),
      short_description: str(row, "short_description", "descripcion_corta", "Descripción corta") || null,
      description: str(row, "description", "descripcion", "Descripción") || null,
      extra_info: str(row, "extra_info", "informacion_adicional", "Información adicional") || null,
      main_image: str(row, "main_image", "imagen", "Imagen", "image_url") || null,
      video_url: str(row, "video_url", "video", "Video") || null,
      features: featuresRaw
        ? featuresRaw.split("|").map((f) => f.trim()).filter(Boolean)
        : [],
      specs,
    };
    const isNew = bool(row, "is_new", "nuevo", "Nuevo");
    const featured = bool(row, "featured", "destacado", "Destacado");
    const active = bool(row, "active", "activo", "Activo");
    if (isNew !== undefined) payload["is_new"] = isNew;
    if (featured !== undefined) payload["featured"] = featured;
    if (active !== undefined) payload["active"] = active;

    try {
      if (brandName) payload["brand_id"] = await resolveRef(db, "brands", brandName, cache);
      if (categoryName) payload["category_id"] = await resolveRef(db, "categories", categoryName, cache);
      if (subcategoryName)
        payload["subcategory_id"] = await resolveRef(db, "categories", subcategoryName, cache);
    } catch (e) {
      issues.push({ row: line, sku, message: (e as Error).message });
      skipped++;
      continue;
    }

    if (dryRun) {
      existing ? updated++ : created++;
      continue;
    }

    if (existing) {
      const { error } = await db.from("products").update(payload).eq("id", existing.id);
      if (error) {
        issues.push({ row: line, sku, message: error.message });
        skipped++;
        continue;
      }
      updated++;
    } else {
      const { error } = await db.from("products").insert(payload);
      if (error) {
        issues.push({ row: line, sku, message: error.message });
        skipped++;
        continue;
      }
      created++;
    }
  }

  return { ok: issues.length === 0, dryRun, created, updated, skipped, issues };
}
