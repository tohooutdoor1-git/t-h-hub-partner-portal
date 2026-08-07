import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { HubShell } from "@/components/hub/HubShell";
import { StatusBadge, orderTone } from "@/components/hub/Badges";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/useMe";
import { listMyOrders } from "@/lib/quotes.functions";
import { money2, shortDate } from "@/lib/format";
import { ORDER_FLOW, ORDER_STATUS_LABEL } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos — TÖHÖ HUB" },
      {
        name: "description",
        content: "Da seguimiento a tus pedidos TÖHÖ: estatus, partidas e importes por folio.",
      },
      { property: "og:title", content: "Pedidos — TÖHÖ HUB" },
      { property: "og:description", content: "Seguimiento de pedidos TÖHÖ en tiempo real." },
    ],
  }),
  component: PedidosPage,
});

function PedidosPage() {
  const { data: me } = useMe();
  const fn = useServerFn(listMyOrders);
  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn() });
  const orders = (data?.orders ?? []) as Array<Record<string, any>>;

  return (
    <HubShell
      isAdmin={me?.roles.includes("admin") ?? false}
      title="Pedidos"
      subtitle="Cotizaciones confirmadas por tu ejecutivo"
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="hub-card mx-auto max-w-lg p-10 text-center text-sm text-muted-foreground">
          Todavía no tienes pedidos. Cuando tu ejecutivo confirme una cotización aparecerá aquí.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <article key={String(o["id"])} className="hub-card space-y-4 p-5">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-base font-semibold">{String(o["folio"])}</p>
                  <p className="text-xs text-muted-foreground">
                    Creado el {shortDate(o["created_at"])}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-display text-sm font-semibold">{money2(o["total"])}</p>
                  <StatusBadge
                    label={ORDER_STATUS_LABEL[String(o["status"])] ?? String(o["status"])}
                    tone={orderTone(String(o["status"]))}
                  />
                </div>
              </header>

              <Timeline status={String(o["status"])} />

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">Producto</th>
                      <th className="p-3 text-right">Cant.</th>
                      <th className="p-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((o["items"] ?? []) as Array<Record<string, any>>).map((i) => (
                      <tr key={String(i["id"])} className="border-t border-border">
                        <td className="p-3">
                          <p className="font-medium">{String(i["name"])}</p>
                          <p className="text-xs text-muted-foreground">SKU {String(i["sku"])}</p>
                        </td>
                        <td className="p-3 text-right">{Number(i["quantity"])}</td>
                        <td className="p-3 text-right">
                          {money2(Number(i["unit_price"]) * Number(i["quantity"]))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </HubShell>
  );
}

function Timeline({ status }: { status: string }) {
  if (["rejected", "cancelled"].includes(status)) {
    return (
      <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
        Este pedido fue {ORDER_STATUS_LABEL[status]?.toLowerCase()}. Contacta a tu ejecutivo para más
        detalles.
      </p>
    );
  }
  const current = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);
  return (
    <ol className="flex flex-wrap gap-x-2 gap-y-3">
      {ORDER_FLOW.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full text-[0.65rem] font-semibold",
                done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs",
                done ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {ORDER_STATUS_LABEL[step]}
            </span>
            {i < ORDER_FLOW.length - 1 && <span className="mx-1 h-px w-4 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
