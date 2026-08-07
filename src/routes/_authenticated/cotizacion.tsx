import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Send, Trash2 } from "lucide-react";
import { HubShell } from "@/components/hub/HubShell";
import { ProductImage } from "@/components/hub/ProductCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/useMe";
import { useCart, useCartActions } from "@/hooks/useCart";
import { money2 } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cotizacion")({
  head: () => ({
    meta: [
      { title: "Mi cotización — TÖHÖ HUB" },
      {
        name: "description",
        content: "Revisa las partidas de tu cotización TÖHÖ y envíala a tu ejecutivo asignado.",
      },
      { property: "og:title", content: "Mi cotización — TÖHÖ HUB" },
      { property: "og:description", content: "Arma y envía tu cotización TÖHÖ." },
    ],
  }),
  component: CotizacionPage,
});

function CotizacionPage() {
  const { data: me } = useMe();
  const { data, isLoading } = useCart();
  const { update, clear, submit } = useCartActions();
  const [comments, setComments] = useState("");

  const items = (data?.items ?? []) as Array<Record<string, any>>;
  const discount = Number(data?.discount_pct ?? 0);
  const subtotal = items.reduce((s, i) => s + Number(i["list_price"]) * Number(i["quantity"]), 0);
  const total = items.reduce((s, i) => s + Number(i["unit_price"]) * Number(i["quantity"]), 0);
  const seller = (me?.distributor as any)?.seller;

  return (
    <HubShell
      isAdmin={me?.roles.includes("admin") ?? false}
      title="Mi cotización"
      subtitle="Sin pagos en línea: tu ejecutivo confirma disponibilidad y condiciones"
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="hub-card mx-auto max-w-lg p-10 text-center">
          <h2 className="font-display text-lg font-semibold">Tu cotización está vacía</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Explora el catálogo y agrega los productos que necesitas.
          </p>
          <Button asChild className="mt-5">
            <Link to="/catalogo">Ir al catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={String(item["id"])} className="hub-card flex gap-4 p-3">
                <div className="w-24 shrink-0">
                  <ProductImage src={item["image"]} alt={String(item["name"])} className="aspect-square" />
                </div>
                <div className="flex flex-1 flex-col justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-semibold leading-snug">
                      {String(item["name"])}
                    </p>
                    <p className="text-xs text-muted-foreground">SKU {String(item["sku"])}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-through">
                      {money2(item["list_price"])}
                    </p>
                    <p className="text-sm font-semibold text-primary">{money2(item["unit_price"])}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border border-input">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          update.mutate({
                            item_id: String(item["id"]),
                            quantity: Number(item["quantity"]) - 1,
                          })
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium">
                        {Number(item["quantity"])}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          update.mutate({
                            item_id: String(item["id"]),
                            quantity: Number(item["quantity"]) + 1,
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-display text-sm font-semibold">
                        {money2(Number(item["unit_price"]) * Number(item["quantity"]))}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => update.mutate({ item_id: String(item["id"]), quantity: 0 })}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => clear.mutate()} disabled={clear.isPending}>
              Vaciar cotización
            </Button>
          </div>

          <aside className="hub-card h-fit space-y-4 p-5">
            <h2 className="font-display text-base font-semibold">Resumen</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Subtotal lista" value={money2(subtotal)} />
              <Row label={`Descuento nivel (${discount}%)`} value={`- ${money2(subtotal - total)}`} />
              <div className="border-t border-border pt-2">
                <Row label="Total estimado" value={money2(total)} strong />
              </div>
            </dl>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Los importes son estimados. Tu ejecutivo confirmará disponibilidad, tiempos de entrega y
              condiciones comerciales.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="comments">
                Comentarios
              </label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Fechas requeridas, destino de entrega, notas…"
                rows={4}
              />
            </div>
            <Button
              className="w-full"
              disabled={submit.isPending}
              onClick={() => submit.mutate({ comments })}
            >
              <Send className="h-4 w-4" /> Enviar a mi ejecutivo
            </Button>
            {seller?.name && (
              <p className="text-xs text-muted-foreground">
                Ejecutivo asignado: <span className="font-medium">{seller.name}</span>
                {seller.email ? ` · ${seller.email}` : ""}
              </p>
            )}
          </aside>
        </div>
      )}
    </HubShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-display text-base font-semibold text-primary" : "font-medium"}>
        {value}
      </dd>
    </div>
  );
}
