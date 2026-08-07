import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { importRows } from "@/lib/import.functions";

type Row = Record<string, string | number | boolean | null>;
type Result = {
  ok: boolean;
  dryRun: boolean;
  created: number;
  updated: number;
  skipped: number;
  issues: Array<{ row: number; sku: string; message: string }>;
};

export function ImportTab() {
  const fn = useServerFn(importRows);
  const [mode, setMode] = useState<"products" | "stock" | "prices">("products");
  const [rows, setRows] = useState<Row[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const run = useMutation({
    mutationFn: (dryRun: boolean) => fn({ data: { mode, dryRun, rows } }),
    onSuccess: (res) => {
      setResult(res as Result);
      toast.success((res as Result).dryRun ? "Simulación lista" : "Importación aplicada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onFile(file: File) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0] as string];
    const parsed = XLSX.utils.sheet_to_json<Row>(sheet as never, { defval: null });
    setRows(parsed);
    setResult(null);
    toast.success(`${parsed.length} filas leídas`);
  }

  return (
    <div className="hub-card space-y-4 p-5">
      <h3 className="font-display text-base font-semibold">Importar desde Excel / CSV</h3>
      <p className="text-xs text-muted-foreground">
        Productos: SKU, Nombre, Marca, Categoría, Precio, Inventario. Inventario: SKU, Inventario.
        Precios: SKU, Precio.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Tipo de carga</Label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="products">Productos</option>
            <option value="stock">Inventario</option>
            <option value="prices">Precios</option>
          </select>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm">
          Seleccionar archivo
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </label>
        <Button
          variant="secondary"
          size="sm"
          disabled={rows.length === 0 || run.isPending}
          onClick={() => run.mutate(true)}
        >
          Simular
        </Button>
        <Button
          size="sm"
          disabled={rows.length === 0 || run.isPending}
          onClick={() => run.mutate(false)}
        >
          Aplicar importación
        </Button>
        {rows.length > 0 && (
          <span className="text-xs text-muted-foreground">{rows.length} filas cargadas</span>
        )}
      </div>

      {result && (
        <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
          <p>
            {result.dryRun ? "Simulación: " : "Resultado: "}
            <span className="font-medium">{result.created} nuevos</span>,{" "}
            <span className="font-medium">{result.updated} actualizados</span>,{" "}
            <span className="font-medium">{result.skipped} omitidos</span>
          </p>
          {result.issues.length > 0 && (
            <ul className="max-h-56 space-y-1 overflow-y-auto text-xs text-muted-foreground">
              {result.issues.map((i, idx) => (
                <li key={idx}>
                  Fila {i.row} {i.sku ? `(${i.sku})` : ""}: {i.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
