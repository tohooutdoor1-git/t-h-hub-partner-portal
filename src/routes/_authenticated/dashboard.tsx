import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowUpRight, ShieldCheck, TrendingUp } from "lucide-react";
import { HubShell } from "@/components/hub/HubShell";
import { LevelBadge, StatusBadge, quoteTone, orderTone } from "@/components/hub/Badges";
import { LevelTrack } from "@/components/hub/LevelTrack";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { getDistributorDashboard, bootstrapAdmin } from "@/lib/hub.functions";
import { money, shortDate, QUOTE_STATUS_LABEL, ORDER_STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TÖHÖ HUB" },
      {
        name: "description",
        content: "Tu nivel, descuentos, compras acumuladas y cotizaciones en TÖHÖ HUB.",
      },
      { property: "og:title", content: "Dashboard — TÖHÖ HUB" },
      { property: "og:description", content: "Nivel, descuentos y cotizaciones del distribuidor." },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="hub-card p-5 transition-shadow duration-300 hover:shadow-lift">
      <p className="hub-eyebrow">{label}</p>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { data: me, isLoading } = useMe();
  const dashFn = useServerFn(getDistributorDashboard);
  const bootstrapFn = useServerFn(bootstrapAdmin);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashFn(),
    enabled: Boolean(me),
  });

  const claim = useMutation({
    mutationFn: () => bootstrapFn(),
    onSuccess: () => {
      toast.success("Cuenta activada como administrador TÖHÖ");
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isAdmin = me?.roles.includes("admin") ?? false;
  const dist = me?.distributor as
    | {
        contact_name: string;
        company: string;
        level_code: string;
        accumulated_purchases: number;
        level?: { name: string; discount_pct: number; threshold: number } | null;
        seller?: { name: string } | null;
      }
    | null
    | undefined;

  const levels = (me?.levels ?? []) as Array<{
    code: string;
    name: string;
    discount_pct: number;
    threshold: number;
    sort_order: number;
  }>;
  const current = levels.find((l) => l.code === dist?.level_code);
  const next = levels.find((l) => (current ? l.sort_order === current.sort_order + 1 : false));
  const accumulated = Number(dist?.accumulated_purchases ?? 0);
  const goal = Number(next?.threshold ?? 0);
  const progress = next ? Math.min(100, Math.round((accumulated / (goal || 1)) * 100)) : 100;
  const missing = Math.max(0, goal - accumulated);

  const quotes = (data?.quotes ?? []) as Array<Record<string, unknown>>;
  const orders = (data?.orders ?? []) as Array<Record<string, unknown>>;
  const promotions = (data?.promotions ?? []) as Array<Record<string, unknown>>;
  const activeQuotes = quotes.filter((q) =>
    ["pending", "in_review", "draft"].includes(String(q["status"])),
  ).length;

  if (isLoading) {
    return (
      <HubShell title="Dashboard">
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </HubShell>
    );
  }

  if (!dist && !isAdmin) {
    return (
      <HubShell title="Bienvenido a TÖHÖ HUB">
        <div className="hub-card mx-auto max-w-lg p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-xl font-semibold">Cuenta sin perfil asignado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu usuario aún no está vinculado a un distribuidor. Si eres del equipo TÖHÖ y estás
            configurando la plataforma por primera vez, activa tu acceso administrativo.
          </p>
          <Button className="mt-6" onClick={() => claim.mutate()} disabled={claim.isPending}>
            Activar acceso administrativo
          </Button>
        </div>
      </HubShell>
    );
  }

  return (
    <HubShell
      isAdmin={isAdmin}
      isSeller={me?.roles.includes("seller") ?? false}
      title={`Bienvenido, ${dist?.contact_name?.split(" ")[0] ?? "equipo TÖHÖ"}`}
      subtitle={
        dist
          ? `${dist.company} · Ejecutivo: ${dist.seller?.name ?? "por asignar"}`
          : "Panel interno TÖHÖ"
      }
      right={dist ? <LevelBadge code={dist.level_code} /> : undefined}
    >
      {dist && (
        <LevelTrack levels={levels} currentCode={dist.level_code} accumulated={accumulated} />
      )}

      {dist && (
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="hub-card relative overflow-hidden p-6 lg:col-span-2">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-soft blur-2xl" />
            <div className="relative">
              <p className="hub-eyebrow">Siguiente meta</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="font-display text-2xl font-semibold">
                  {current?.name ?? "Bronze"}
                </span>
                {next && (
                  <>
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-display text-2xl font-semibold text-primary">
                      {next.name}
                    </span>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {next
                  ? `Te faltan ${money(missing)} para alcanzar ${next.name}`
                  : "Has alcanzado el nivel más alto del programa."}
              </p>
              <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>Acumulado {money(accumulated)}</span>
                <span>{progress}%</span>
                <span>{next ? `Meta ${money(goal)}` : "Nivel máximo"}</span>
              </div>
            </div>
          </div>


          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard
              label="Descuento vigente"
              value={`${Number(current?.discount_pct ?? 0)}%`}
              hint="Sobre precio lista"
            />
            <StatCard label="Compras acumuladas" value={money(accumulated)} />
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Nivel actual" value={current?.name ?? "—"} />
        <StatCard label="Cotizaciones activas" value={String(activeQuotes)} />
        <StatCard label="Pedidos registrados" value={String(orders.length)} />
        <StatCard label="Promociones vigentes" value={String(promotions.length)} />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Cotizaciones recientes</h2>
          <Link
            to="/cotizaciones"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver todas <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="hub-card mt-3 overflow-hidden">
          {quotes.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Aún no tienes cotizaciones. Explora el catálogo y arma la primera.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {quotes.map((q) => (
                <li
                  key={String(q["id"])}
                  className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{String(q["folio"])}</p>
                    <p className="text-xs text-muted-foreground">
                      {shortDate(String(q["created_at"]))}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(q["quote_items"] as Array<{ count: number }> | undefined)?.[0]?.count ?? 0}{" "}
                    productos
                  </p>
                  <p className="w-28 text-right font-medium">{money(Number(q["total"]))}</p>
                  <StatusBadge
                    label={QUOTE_STATUS_LABEL[String(q["status"])] ?? String(q["status"])}
                    tone={quoteTone(String(q["status"]))}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Pedidos confirmados</h2>
        <div className="hub-card mt-3 overflow-hidden">
          {orders.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Tus pedidos aprobados por tu ejecutivo aparecerán aquí.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {orders.map((o) => (
                <li
                  key={String(o["id"])}
                  className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{String(o["folio"])}</p>
                    <p className="text-xs text-muted-foreground">
                      {shortDate(String(o["created_at"]))}
                    </p>
                  </div>
                  <p className="w-28 text-right font-medium">{money(Number(o["total"]))}</p>
                  <StatusBadge
                    label={ORDER_STATUS_LABEL[String(o["status"])] ?? String(o["status"])}
                    tone={orderTone(String(o["status"]))}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </HubShell>
  );
}
