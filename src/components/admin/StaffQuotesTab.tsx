import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, orderTone, quoteTone } from "@/components/hub/Badges";
import { staffListQuotes, staffSetOrderStatus, staffSetQuoteStatus } from "@/lib/quotes.functions";
import { money2, shortDate } from "@/lib/format";
import { ORDER_STATUS_LABEL, QUOTE_STATUS_LABEL } from "@/lib/pricing";
import { downloadQuotePdf } from "@/lib/quote-pdf";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

type Row = Record<string, any>;

const QUOTE_ACTIONS = ["in_review", "approved", "confirmed", "rejected", "cancelled"] as const;
const ORDER_ACTIONS = [
  "received",
  "in_review",
  "availability_confirmed",
  "approved",
  "preparing",
  "shipped",
  "delivered",
  "rejected",
  "cancelled",
] as const;

export function StaffQuotesTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(staffListQuotes);
  const quoteFn = useServerFn(staffSetQuoteStatus);
  const orderFn = useServerFn(staffSetOrderStatus);

  const { data } = useQuery({ queryKey: ["staff-quotes"], queryFn: () => listFn() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["staff-quotes"] });

  const setQuote = useMutation({
    mutationFn: (v: { id: string; status: string }) => quoteFn({ data: v as never }),
    onSuccess: (res: { orderFolio?: string | null }) => {
      toast.success(res.orderFolio ? `Pedido ${res.orderFolio} generado` : "Cotización actualizada");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setOrder = useMutation({
    mutationFn: (v: { id: string; status: string }) => orderFn({ data: v as never }),
    onSuccess: () => {
      toast.success("Pedido actualizado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const quotes = (data?.quotes ?? []) as Row[];
  const orders = (data?.orders ?? []) as Row[];

  return (
    <Tabs defaultValue="cot">
      <TabsList>
        <TabsTrigger value="cot">Cotizaciones ({quotes.length})</TabsTrigger>
        <TabsTrigger value="ped">Pedidos ({orders.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="cot" className="mt-4 space-y-3">
        {quotes.map((q) => (
          <article key={String(q["id"])} className="hub-card space-y-2 p-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-sm font-semibold">{String(q["folio"])}</p>
                <p className="text-xs text-muted-foreground">
                  {q["distributor"]?.company ?? "—"} · {shortDate(q["created_at"])} ·{" "}
                  {(q["items"] ?? []).length} partidas
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-display text-sm font-semibold">{money2(q["total"])}</p>
                <StatusBadge
                  label={QUOTE_STATUS_LABEL[String(q["status"])] ?? String(q["status"])}
                  tone={quoteTone(String(q["status"]))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadQuotePdf(q)}
                >
                  <FileDown className="mr-1 h-4 w-4" /> PDF
                </Button>
                <select
                  value={String(q["status"])}
                  onChange={(e) => setQuote.mutate({ id: String(q["id"]), status: e.target.value })}
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                >
                  <option value={String(q["status"])} disabled>
                    Cambiar estado…
                  </option>
                  {QUOTE_ACTIONS.map((s) => (
                    <option key={s} value={s}>
                      {QUOTE_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </header>
            <ul className="text-xs text-muted-foreground">
              {((q["items"] ?? []) as Row[]).map((i) => (
                <li key={String(i["id"])}>
                  {Number(i["quantity"])} × {String(i["name"])} — {money2(i["unit_price"])}
                </li>
              ))}
            </ul>
          </article>
        ))}
        {quotes.length === 0 && (
          <p className="hub-card p-8 text-center text-sm text-muted-foreground">Sin cotizaciones.</p>
        )}
      </TabsContent>

      <TabsContent value="ped" className="mt-4 space-y-3">
        {orders.map((o) => (
          <article key={String(o["id"])} className="hub-card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-display text-sm font-semibold">{String(o["folio"])}</p>
              <p className="text-xs text-muted-foreground">
                {o["distributor"]?.company ?? "—"} · {shortDate(o["created_at"])}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-display text-sm font-semibold">{money2(o["total"])}</p>
              <StatusBadge
                label={ORDER_STATUS_LABEL[String(o["status"])] ?? String(o["status"])}
                tone={orderTone(String(o["status"]))}
              />
              <select
                value={String(o["status"])}
                onChange={(e) => setOrder.mutate({ id: String(o["id"]), status: e.target.value })}
                className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
              >
                {ORDER_ACTIONS.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </article>
        ))}
        {orders.length === 0 && (
          <p className="hub-card p-8 text-center text-sm text-muted-foreground">Sin pedidos.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}
