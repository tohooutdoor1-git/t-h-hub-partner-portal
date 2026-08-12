import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Save, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { staffUpdateQuoteItems } from "@/lib/quotes.functions";
import { money2 } from "@/lib/format";

type Row = Record<string, any>;

type Draft = {
  id: string;
  name: string;
  sku: string;
  list_price: number;
  quantity: number;
  unit_price: number;
  remove: boolean;
};

/** Editor de partidas (cantidad, precio unitario y baja) para el equipo comercial. */
export function QuoteItemsEditor({ quote }: { quote: Row }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(staffUpdateQuoteItems);
  const items = (quote["items"] ?? []) as Row[];

  const [draft, setDraft] = useState<Draft[]>([]);
  useEffect(() => {
    setDraft(
      items.map((i) => ({
        id: String(i["id"]),
        name: String(i["name"]),
        sku: String(i["sku"]),
        list_price: Number(i["list_price"]),
        quantity: Number(i["quantity"]),
        unit_price: Number(i["unit_price"]),
        remove: false,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items.map((i) => [i["id"], i["quantity"], i["unit_price"]]))]);

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          id: String(quote["id"]),
          items: draft.map((d) => ({
            id: d.id,
            quantity: Math.max(1, Math.round(d.quantity || 1)),
            unit_price: Math.max(0, Number(d.unit_price) || 0),
            remove: d.remove,
          })),
        },
      }),
    onSuccess: () => {
      toast.success("Partidas actualizadas");
      qc.invalidateQueries({ queryKey: ["staff-quotes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = (id: string, values: Partial<Draft>) =>
    setDraft((prev) => prev.map((d) => (d.id === id ? { ...d, ...values } : d)));

  const total = draft
    .filter((d) => !d.remove)
    .reduce((s, d) => s + (Number(d.unit_price) || 0) * (Number(d.quantity) || 0), 0);

  const editable = !["confirmed", "rejected", "cancelled"].includes(String(quote["status"]));

  if (draft.length === 0) {
    return <p className="text-xs text-muted-foreground">Esta cotización no tiene partidas.</p>;
  }

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <p className="hub-eyebrow">Ajuste de partidas</p>
      <div className="space-y-2">
        {draft.map((d) => (
          <div
            key={d.id}
            className={`flex flex-wrap items-center gap-2 ${d.remove ? "opacity-50" : ""}`}
          >
            <div className="min-w-44 flex-1">
              <p className="truncate text-sm font-medium">{d.name}</p>
              <p className="text-xs text-muted-foreground">
                SKU {d.sku} · lista {money2(d.list_price)}
              </p>
            </div>
            <Input
              type="number"
              min={1}
              step={1}
              disabled={!editable || d.remove}
              value={d.quantity}
              onChange={(e) => patch(d.id, { quantity: Number(e.target.value) })}
              className="h-9 w-20"
              aria-label={`Cantidad de ${d.name}`}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              disabled={!editable || d.remove}
              value={d.unit_price}
              onChange={(e) => patch(d.id, { unit_price: Number(e.target.value) })}
              className="h-9 w-28"
              aria-label={`Precio unitario de ${d.name}`}
            />
            <p className="w-28 text-right text-sm font-medium">
              {money2((Number(d.unit_price) || 0) * (Number(d.quantity) || 0))}
            </p>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={!editable}
              onClick={() => patch(d.id, { remove: !d.remove })}
              aria-label={d.remove ? "Restaurar partida" : "Quitar partida"}
            >
              {d.remove ? <Undo2 className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
        <p className="text-sm">
          Nuevo total: <span className="font-display font-semibold">{money2(total)}</span>
        </p>
        <Button
          type="button"
          size="sm"
          disabled={!editable || save.isPending}
          onClick={() => save.mutate()}
        >
          <Save className="mr-1 h-4 w-4" /> Guardar ajustes
        </Button>
      </div>
    </div>
  );
}
