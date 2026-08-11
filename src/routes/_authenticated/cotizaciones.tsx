import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { HubShell } from "@/components/hub/HubShell";
import { StatusBadge, quoteTone } from "@/components/hub/Badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMe } from "@/hooks/useMe";
import { getQuote, listMyQuotes } from "@/lib/quotes.functions";
import { money2, shortDate } from "@/lib/format";
import { QUOTE_STATUS_LABEL } from "@/lib/pricing";
import { downloadQuotePdf } from "@/lib/quote-pdf";
import { FileDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cotizaciones")({
  head: () => ({
    meta: [
      { title: "Cotizaciones — TÖHÖ HUB" },
      {
        name: "description",
        content: "Historial de cotizaciones TÖHÖ con folios, estatus y detalle de partidas.",
      },
      { property: "og:title", content: "Cotizaciones — TÖHÖ HUB" },
      { property: "og:description", content: "Consulta el estatus de tus cotizaciones TÖHÖ." },
    ],
  }),
  component: CotizacionesPage,
});

function CotizacionesPage() {
  const { data: me } = useMe();
  const listFn = useServerFn(listMyQuotes);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["my-quotes"], queryFn: () => listFn() });
  const quotes = (data?.quotes ?? []) as Array<Record<string, any>>;

  return (
    <HubShell
      isAdmin={me?.roles.includes("admin") ?? false}
      isSeller={me?.roles.includes("seller") ?? false}
      title="Cotizaciones"
      subtitle="Historial y seguimiento de tus solicitudes"
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="hub-card mx-auto max-w-lg p-10 text-center">
          <h2 className="font-display text-lg font-semibold">Aún no envías cotizaciones</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Arma tu primera solicitud desde el catálogo.
          </p>
          <Button asChild className="mt-5">
            <Link to="/catalogo">Ir al catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <button
              key={String(q["id"])}
              type="button"
              onClick={() => setOpenId(String(q["id"]))}
              className="hub-card flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-display text-sm font-semibold">{String(q["folio"])}</p>
                <p className="text-xs text-muted-foreground">
                  {shortDate(q["submitted_at"] ?? q["created_at"])} ·{" "}
                  {(q["items"] ?? []).length} partidas
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-display text-sm font-semibold">{money2(q["total"])}</p>
                <StatusBadge
                  label={QUOTE_STATUS_LABEL[String(q["status"])] ?? String(q["status"])}
                  tone={quoteTone(String(q["status"]))}
                />
              </div>
            </button>
          ))}
        </div>
      )}

      <QuoteDetailDialog id={openId} onClose={() => setOpenId(null)} />
    </HubShell>
  );
}

function QuoteDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const fn = useServerFn(getQuote);
  const { data, isLoading } = useQuery({
    queryKey: ["quote", id],
    queryFn: () => fn({ data: { id: id! } }),
    enabled: Boolean(id),
  });
  const quote = data?.quote as Record<string, any> | undefined;

  return (
    <Dialog open={Boolean(id)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            Cotización {quote ? String(quote["folio"]) : ""}
          </DialogTitle>
        </DialogHeader>
        {isLoading || !quote ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <StatusBadge
                label={QUOTE_STATUS_LABEL[String(quote["status"])] ?? String(quote["status"])}
                tone={quoteTone(String(quote["status"]))}
              />
              <span className="text-muted-foreground">
                {shortDate(quote["submitted_at"] ?? quote["created_at"])}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => downloadQuotePdf(quote)}
              >
                <FileDown className="mr-1 h-4 w-4" /> Descargar PDF
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Producto</th>
                    <th className="p-3 text-right">Cant.</th>
                    <th className="p-3 text-right">Precio</th>
                    <th className="p-3 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {((quote["items"] ?? []) as Array<Record<string, any>>).map((i) => (
                    <tr key={String(i["id"])} className="border-t border-border">
                      <td className="p-3">
                        <p className="font-medium">{String(i["name"])}</p>
                        <p className="text-xs text-muted-foreground">SKU {String(i["sku"])}</p>
                      </td>
                      <td className="p-3 text-right">{Number(i["quantity"])}</td>
                      <td className="p-3 text-right">{money2(i["unit_price"])}</td>
                      <td className="p-3 text-right">
                        {money2(Number(i["unit_price"]) * Number(i["quantity"]))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal lista</dt>
                <dd>{money2(quote["subtotal_list"])}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Descuento</dt>
                <dd>- {money2(quote["discount_amount"])}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-medium">Total</dt>
                <dd className="font-display text-base font-semibold text-primary">
                  {money2(quote["total"])}
                </dd>
              </div>
            </dl>

            {quote["comments"] && (
              <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                {String(quote["comments"])}
              </p>
            )}
            {quote["seller"]?.name && (
              <p className="text-xs text-muted-foreground">
                Ejecutivo: {quote["seller"].name}
                {quote["seller"].whatsapp ? ` · WhatsApp ${quote["seller"].whatsapp}` : ""}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
