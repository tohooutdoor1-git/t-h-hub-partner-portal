import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminDeleteEntity, adminSaveEntity } from "@/lib/catalog.functions";

type Row = Record<string, any>;
type Table = "brands" | "categories" | "banners" | "promotions";

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function EntitiesTab({ data }: { data: Row | undefined }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(adminSaveEntity);
  const delFn = useServerFn(adminDeleteEntity);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-catalog"] });

  const save = useMutation({
    mutationFn: (v: { table: Table; id?: string | null; values: Record<string, unknown> }) =>
      saveFn({ data: v as never }),
    onSuccess: () => {
      toast.success("Guardado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (v: { table: Table; id: string }) => delFn({ data: v as never }),
    onSuccess: () => {
      toast.success("Eliminado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const brands = (data?.["brands"] ?? []) as Row[];
  const categories = (data?.["categories"] ?? []) as Row[];
  const banners = (data?.["banners"] ?? []) as Row[];
  const promotions = (data?.["promotions"] ?? []) as Row[];
  const products = (data?.["products"] ?? []) as Row[];

  const [brandName, setBrandName] = useState("");
  const [catName, setCatName] = useState("");
  const [catParent, setCatParent] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="hub-card space-y-3 p-5">
        <h3 className="font-display text-base font-semibold">Marcas</h3>
        <div className="flex gap-2">
          <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Nueva marca" />
          <Button
            size="sm"
            onClick={() => {
              if (!brandName.trim()) return;
              save.mutate({
                table: "brands",
                values: { name: brandName.trim(), slug: slugify(brandName), active: true },
              });
              setBrandName("");
            }}
          >
            Agregar
          </Button>
        </div>
        <ul className="divide-y divide-border text-sm">
          {brands.map((b) => (
            <li key={String(b["id"])} className="flex items-center justify-between gap-2 py-2">
              <span>{String(b["name"])}</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    defaultChecked={Boolean(b["featured"])}
                    onChange={(e) =>
                      save.mutate({
                        table: "brands",
                        id: String(b["id"]),
                        values: { featured: e.target.checked },
                      })
                    }
                  />
                  Destacada
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate({ table: "brands", id: String(b["id"]) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="hub-card space-y-3 p-5">
        <h3 className="font-display text-base font-semibold">Categorías</h3>
        <div className="flex flex-wrap gap-2">
          <Input
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="Nueva categoría"
            className="min-w-[140px] flex-1"
          />
          <select
            value={catParent}
            onChange={(e) => setCatParent(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Categoría raíz</option>
            {categories
              .filter((c) => !c["parent_id"])
              .map((c) => (
                <option key={String(c["id"])} value={String(c["id"])}>
                  Sub de {String(c["name"])}
                </option>
              ))}
          </select>
          <Button
            size="sm"
            onClick={() => {
              if (!catName.trim()) return;
              save.mutate({
                table: "categories",
                values: {
                  name: catName.trim(),
                  slug: slugify(catName),
                  parent_id: catParent || null,
                  active: true,
                },
              });
              setCatName("");
            }}
          >
            Agregar
          </Button>
        </div>
        <ul className="divide-y divide-border text-sm">
          {categories.map((c) => (
            <li key={String(c["id"])} className="flex items-center justify-between py-2">
              <span className={c["parent_id"] ? "pl-4 text-muted-foreground" : ""}>
                {c["parent_id"] ? "↳ " : ""}
                {String(c["name"])}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove.mutate({ table: "categories", id: String(c["id"]) })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="hub-card space-y-3 p-5">
        <h3 className="font-display text-base font-semibold">Banners del catálogo</h3>
        <form
          className="grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            save.mutate({
              table: "banners",
              values: {
                title: f.get("title") || null,
                subtitle: f.get("subtitle") || null,
                image_url: f.get("image_url") || null,
                link_url: f.get("link_url") || null,
                active: true,
              },
            });
            e.currentTarget.reset();
          }}
        >
          <Input name="title" placeholder="Título" />
          <Input name="subtitle" placeholder="Subtítulo" />
          <Input name="image_url" placeholder="URL de imagen" />
          <Input name="link_url" placeholder="Enlace (opcional)" />
          <Button type="submit" size="sm" className="sm:col-span-2">
            Agregar banner
          </Button>
        </form>
        <ul className="divide-y divide-border text-sm">
          {banners.map((b) => (
            <li key={String(b["id"])} className="flex items-center justify-between py-2">
              <span>{String(b["title"] ?? "Banner")}</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    defaultChecked={Boolean(b["active"])}
                    onChange={(e) =>
                      save.mutate({
                        table: "banners",
                        id: String(b["id"]),
                        values: { active: e.target.checked },
                      })
                    }
                  />
                  Activo
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate({ table: "banners", id: String(b["id"]) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="hub-card space-y-3 p-5">
        <h3 className="font-display text-base font-semibold">Promociones</h3>
        <form
          className="grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            save.mutate({
              table: "promotions",
              values: {
                product_id: f.get("product_id") || null,
                title: f.get("title") || null,
                badge: f.get("badge") || "Promoción",
                promo_price: f.get("promo_price") ? Number(f.get("promo_price")) : null,
                active: true,
              },
            });
            e.currentTarget.reset();
          }}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Producto</Label>
            <select
              name="product_id"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Sin producto</option>
              {products.slice(0, 300).map((p) => (
                <option key={String(p["id"])} value={String(p["id"])}>
                  {String(p["sku"])} — {String(p["name"])}
                </option>
              ))}
            </select>
          </div>
          <Input name="title" placeholder="Título" />
          <Input name="badge" placeholder="Etiqueta (ej. -15%)" />
          <Input name="promo_price" type="number" step="0.01" placeholder="Precio promocional" />
          <Button type="submit" size="sm">
            Agregar promoción
          </Button>
        </form>
        <ul className="divide-y divide-border text-sm">
          {promotions.map((p) => (
            <li key={String(p["id"])} className="flex items-center justify-between py-2">
              <span>{String(p["title"] ?? p["badge"])}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove.mutate({ table: "promotions", id: String(p["id"]) })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
