import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { HubShell } from "@/components/hub/HubShell";
import { ProductImage, stockTone } from "@/components/hub/ProductCard";
import { StatusBadge } from "@/components/hub/Badges";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { useCartActions } from "@/hooks/useCart";
import { listPromotions } from "@/lib/hub-content.functions";
import { money2, shortDate } from "@/lib/format";
import { discountedPrice, STOCK_LABEL } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/promociones")({
  head: () => ({
    meta: [
      { title: "Promociones — TÖHÖ HUB" },
      { name: "description", content: "Promociones exclusivas para distribuidores TÖHÖ." },
      { property: "og:title", content: "Promociones — TÖHÖ HUB" },
      { property: "og:description", content: "Precios especiales vigentes para distribuidores TÖHÖ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Promociones,
});

type Promo = Record<string, any>;

function Promociones() {
  const { data: me } = useMe();
  const listFn = useServerFn(listPromotions);
  const { add } = useCartActions();
  const { data, isLoading } = useQuery({ queryKey: ["promotions"], queryFn: () => listFn() });

  const promos = (data?.promotions ?? []) as Promo[];
  const discount = Number(data?.discount_pct ?? 0);

  return (
    <HubShell
      isAdmin={me?.roles.includes("admin") ?? false}
      isSeller={me?.roles.includes("seller") ?? false}
      title="Promociones"
      subtitle="Precios especiales vigentes para tu cuenta"
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : promos.length === 0 ? (
        <div className="hub-card mx-auto max-w-md p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-lg font-semibold">Sin promociones activas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cuando TÖHÖ publique una campaña vigente la verás aquí con tu precio final.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((p) => {
            const product = p["product"] as Promo | null;
            const base = Number(product?.["list_price"] ?? 0);
            const levelPrice = discountedPrice(base, discount);
            const promoPrice = p["promo_price"] != null ? Number(p["promo_price"]) : null;
            const final = promoPrice ?? levelPrice;
            return (
              <article key={String(p["id"])} className="hub-card flex flex-col p-4">
                <div className="relative">
                  <ProductImage
                    src={p["image_url"] ?? product?.["main_image"]}
                    alt={String(p["title"] ?? product?.["name"] ?? "Promoción")}
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                    {String(p["badge"] ?? "Promoción")}
                  </span>
                </div>
                <div className="mt-3 flex-1 space-y-1">
                  <p className="hub-eyebrow">{product?.["brand"]?.name ?? "TÖHÖ"}</p>
                  <h3 className="font-display text-sm font-semibold leading-snug">
                    {String(p["title"] ?? product?.["name"] ?? "Promoción TÖHÖ")}
                  </h3>
                  {product && (
                    <p className="text-xs text-muted-foreground">SKU {String(product["sku"])}</p>
                  )}
                  {p["ends_at"] && (
                    <p className="text-xs text-muted-foreground">
                      Vigente hasta {shortDate(String(p["ends_at"]))}
                    </p>
                  )}
                </div>
                {product && (
                  <>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground line-through">{money2(base)}</p>
                        <p className="font-display text-base font-semibold text-primary">
                          {money2(final)}
                        </p>
                      </div>
                      <StatusBadge
                        label={STOCK_LABEL[String(product["stock_status"])] ?? "—"}
                        tone={stockTone(String(product["stock_status"]))}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      disabled={product["stock_status"] === "out" || add.isPending}
                      onClick={() =>
                        add.mutate({ product_id: String(product["id"]), quantity: 1 })
                      }
                    >
                      Agregar a cotización
                    </Button>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </HubShell>
  );
}
