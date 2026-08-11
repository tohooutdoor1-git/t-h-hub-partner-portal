import { Award, Medal, Trophy } from "lucide-react";
import { money } from "@/lib/format";

export type Level = {
  code: string;
  name: string;
  discount_pct: number;
  threshold: number;
  sort_order: number;
};

const ICONS: Record<string, typeof Medal> = {
  bronze: Medal,
  silver: Award,
  gold: Trophy,
};

/**
 * Línea de progreso con medallas (Bronze / Silver / Gold).
 * Se muestra al inicio del dashboard del distribuidor.
 */
export function LevelTrack({
  levels,
  currentCode,
  accumulated,
}: {
  levels: Level[];
  currentCode: string;
  accumulated: number;
}) {
  const sorted = [...levels].sort((a, b) => a.sort_order - b.sort_order);
  if (sorted.length === 0) return null;

  const max = Number(sorted[sorted.length - 1]?.threshold ?? 0);
  const current = sorted.find((l) => l.code === currentCode) ?? sorted[0];
  const next = sorted.find((l) => Number(l.threshold) > accumulated);
  const missing = next ? Math.max(0, Number(next.threshold) - accumulated) : 0;

  // Posición de cada medalla proporcional a su umbral sobre el nivel máximo.
  const posOf = (v: number) => (max > 0 ? Math.min(100, (v / max) * 100) : 0);
  const progress = Math.min(100, posOf(accumulated));

  return (
    <section className="hub-card relative overflow-hidden p-6">
      <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary-soft blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="hub-eyebrow">Tu progreso de nivel</p>
            <p className="mt-1 font-display text-xl font-semibold">
              {current?.name ?? "Bronze"}
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                {Number(current?.discount_pct ?? 0)}% de descuento
              </span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {next ? (
              <>
                Te faltan{" "}
                <span className="font-semibold text-primary">{money(missing)}</span> para{" "}
                {next.name}
              </>
            ) : (
              "Has alcanzado el nivel máximo del programa."
            )}
          </p>
        </div>

        <div className="relative mt-10 mb-2 px-1">
          {/* línea base */}
          <div className="h-2 w-full rounded-full bg-muted" />
          {/* línea llena */}
          <div
            className="absolute left-1 top-0 h-2 rounded-full bg-primary transition-[width] duration-1000 ease-out"
            style={{ width: `calc(${progress}% - 0.25rem)` }}
          />

          {sorted.map((lvl) => {
            const reached = accumulated >= Number(lvl.threshold);
            const isCurrent = lvl.code === current?.code;
            const Icon = ICONS[lvl.code.toLowerCase()] ?? Medal;
            return (
              <div
                key={lvl.code}
                className="absolute top-1 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${posOf(Number(lvl.threshold))}%` }}
              >
                <div
                  className={`grid h-9 w-9 place-items-center rounded-full border-2 transition-colors duration-500 ${
                    reached
                      ? "border-primary bg-primary text-primary-foreground shadow-soft"
                      : "border-border bg-background text-muted-foreground"
                  } ${isCurrent ? "ring-4 ring-primary/25" : ""}`}
                  title={`${lvl.name} · ${money(Number(lvl.threshold))}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-center text-[11px] leading-tight">
                  <p className={reached ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {lvl.name}
                  </p>
                  <p className="text-muted-foreground">{money(Number(lvl.threshold))}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Acumulado <span className="font-semibold text-foreground">{money(accumulated)}</span>
          </span>
          <span>{Math.round(progress)}% del programa</span>
        </div>
      </div>
    </section>
  );
}
