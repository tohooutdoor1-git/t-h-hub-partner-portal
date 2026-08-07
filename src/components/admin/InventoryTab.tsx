import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/hub/Badges";
import { stockTone } from "@/components/hub/ProductCard";
import { adminSaveInventoryThresholds, adminSetStock } from "@/lib/catalog.functions";
import { STOCK_LABEL } from "@/lib/pricing";

type Row = Record<string, any>;

export function InventoryTab({ data }: { data: Row | undefined }) {
  const qc = useQueryClient();
  const stockFn = useServerFn(adminSetStock);
  const thresholdFn = useServerFn(adminSaveInventoryThresholds);
  const [search, setSearch] = useState("");

  const products = (data?.["products"] ?? []) as Row[];
  const settings = (data?.["settings"] ?? []) as Row[];
  const thresholds = (settings.find((s) => s["key"] === "inventory_thresholds")?.["value"] ?? {}) as {
    available_min?: number;
    low_min?: number;
  };

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) => String(p["name"]).toLowerCase().includes(t) || String(p["sku"]).toLowerCase().includes(t),
    );
  }, [products, search]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-catalog"] });

  const setStock = useMutation({
    mutationFn: (v: { id: string; stock?: number; stock_status?: string }) => stockFn({ data: v as never }),
    onSuccess: () => {
      toast.success("Inventario actualizado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveThresholds = useMutation({
    mutationFn: (v: { available_min: number; low_min: number }) => thresholdFn({ data: v }),
    onSuccess: () => {
      toast.success("Umbrales guardados");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <section className="hub-card space-y-3 p-5">
        <h3 className="font-display text-base font-semibold">Umbrales de inventario</h3>
        <p className="text-xs text-muted-foreground">
          Los distribuidores nunca ven cantidades exactas, solo el estado calculado con estos umbrales.
        </p>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            saveThresholds.mutate({
              available_min: Number(f.get("available_min")),
              low_min: Number(f.get("low_min")),
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="available_min">Disponible desde</Label>
            <Input
              id="available_min"
              name="available_min"
              type="number"
              defaultValue={thresholds.available_min ?? 11}
              className="w-32"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="low_min">Bajo inventario desde</Label>
            <Input
              id="low_min"
              name="low_min"
              type="number"
              defaultValue={thresholds.low_min ?? 1}
              className="w-32"
            />
          </div>
          <Button type="submit" size="sm" disabled={saveThresholds.isPending}>
            Guardar umbrales
          </Button>
        </form>
      </section>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar producto"
        className="max-w-xs"
      />

      <div className="hub-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-center">Existencia</th>
              <th className="p-3 text-center">Estado visible</th>
              <th className="p-3 text-center">Forzar estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={String(p["id"])} className="border-t border-border">
                <td className="p-3">
                  <p className="font-medium">{String(p["name"])}</p>
                  <p className="text-xs text-muted-foreground">SKU {String(p["sku"])}</p>
                </td>
                <td className="p-3 text-center">
                  <Input
                    type="number"
                    defaultValue={Number(p["stock"])}
                    className="mx-auto w-24 text-center"
                    onBlur={(e) => {
                      const value = Number(e.target.value);
                      if (value !== Number(p["stock"]))
                        setStock.mutate({ id: String(p["id"]), stock: value });
                    }}
                  />
                </td>
                <td className="p-3 text-center">
                  <StatusBadge
                    label={STOCK_LABEL[String(p["stock_status"])] ?? "—"}
                    tone={stockTone(String(p["stock_status"]))}
                  />
                </td>
                <td className="p-3 text-center">
                  <select
                    value={String(p["stock_status"])}
                    onChange={(e) =>
                      setStock.mutate({ id: String(p["id"]), stock_status: e.target.value })
                    }
                    className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                  >
                    {Object.entries(STOCK_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
