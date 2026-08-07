import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Minus, Plus, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/hub/Badges";
import { ProductImage, stockTone } from "@/components/hub/ProductCard";
import { getProductDetail } from "@/lib/catalog.functions";
import { money2 } from "@/lib/format";
import { discountedPrice, STOCK_LABEL } from "@/lib/pricing";

export function ProductDialog({
  productId,
  discountPct,
  onOpenChange,
  onAdd,
  adding,
}: {
  productId: string | null;
  discountPct: number;
  onOpenChange: (open: boolean) => void;
  onAdd: (productId: string, quantity: number) => void;
  adding?: boolean | undefined;
}) {
  const fn = useServerFn(getProductDetail);
  const [qty, setQty] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fn({ data: { id: productId! } }),
    enabled: Boolean(productId),
  });

  const product = data?.product as Record<string, any> | undefined;
  const gallery: Array<{ id: string; url: string | null }> = product
    ? [
        ...(product["main_image"] ? [{ id: "main", url: product["main_image"] as string }] : []),
        ...((product["images"] ?? []) as Array<{ id: string; url: string | null }>),
      ]
    : [];
  const [active, setActive] = useState(0);
  const hero = gallery[Math.min(active, Math.max(gallery.length - 1, 0))]?.url ?? null;

  return (
    <Dialog
      open={Boolean(productId)}
      onOpenChange={(o) => {
        if (!o) {
          setQty(1);
          setActive(0);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {product ? String(product["name"]) : "Producto"}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !product ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <ProductImage src={hero} alt={String(product["name"])} />
              {gallery.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((g, i) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setActive(i)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${
                        i === active ? "border-primary" : "border-border"
                      }`}
                    >
                      <ProductImage src={g.url} alt="" className="h-16" />
                    </button>
                  ))}
                </div>
              )}
              {product["video_url"] && (
                <a
                  href={String(product["video_url"])}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                >
                  <PlayCircle className="h-4 w-4" /> Ver video del producto
                </a>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="hub-eyebrow">{product["brand"]?.name ?? "TÖHÖ"}</p>
                <StatusBadge
                  label={STOCK_LABEL[String(product["stock_status"])] ?? "—"}
                  tone={stockTone(String(product["stock_status"]))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                SKU {String(product["sku"])}
                {product["category"]?.name ? ` · ${product["category"].name}` : ""}
              </p>

              <div className="hub-card bg-primary-soft p-4">
                <p className="text-xs text-muted-foreground line-through">
                  Precio lista {money2(product["list_price"])}
                </p>
                <p className="font-display text-2xl font-semibold text-primary">
                  {money2(discountedPrice(Number(product["list_price"]), discountPct))}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tu precio de distribuidor ({discountPct}% de descuento)
                </p>
              </div>

              {product["short_description"] && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {String(product["short_description"])}
                </p>
              )}
              {product["description"] && (
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {String(product["description"])}
                </p>
              )}

              {Array.isArray(product["features"]) && product["features"].length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {(product["features"] as string[]).map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              {product["specs"] && Object.keys(product["specs"]).length > 0 && (
                <dl className="grid gap-1.5 rounded-xl border border-border p-3 text-sm">
                  {Object.entries(product["specs"] as Record<string, string>).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {product["extra_info"] && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {String(product["extra_info"])}
                </p>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-input">
                  <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center text-sm font-medium">{qty}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQty((q) => q + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  className="flex-1"
                  disabled={product["stock_status"] === "out" || adding}
                  onClick={() => onAdd(String(product["id"]), qty)}
                >
                  {product["stock_status"] === "out" ? "Agotado" : "Agregar a mi cotización"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
