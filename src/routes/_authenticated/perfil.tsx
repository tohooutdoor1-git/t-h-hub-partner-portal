import { createFileRoute } from "@tanstack/react-router";
import { HubShell } from "@/components/hub/HubShell";
import { LevelBadge } from "@/components/hub/Badges";
import { useMe } from "@/hooks/useMe";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil — TÖHÖ HUB" },
      { name: "description", content: "Datos comerciales de tu empresa distribuidora TÖHÖ." },
      { property: "og:title", content: "Mi perfil — TÖHÖ HUB" },
      { property: "og:description", content: "Datos comerciales de tu empresa distribuidora." },
    ],
  }),
  component: Perfil,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function Perfil() {
  const { data: me } = useMe();
  const d = me?.distributor as Record<string, unknown> | null | undefined;
  const level = d?.["level"] as { name: string; discount_pct: number } | undefined;
  const seller = d?.["seller"] as { name: string } | undefined;

  return (
    <HubShell
      isAdmin={me?.roles.includes("admin") ?? false}
      title="Mi perfil"
      subtitle="Información comercial de tu cuenta"
    >
      {!d ? (
        <div className="hub-card p-8 text-center text-sm text-muted-foreground">
          Tu usuario no está vinculado a un distribuidor.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="hub-card p-6">
            <p className="hub-eyebrow">Empresa</p>
            <h2 className="mt-2 font-display text-xl font-semibold">{String(d["company"])}</h2>
            <div className="mt-4">
              <Row label="Contacto" value={String(d["contact_name"])} />
              <Row label="RFC" value={String(d["rfc"] ?? "—")} />
              <Row label="Email" value={String(d["email"])} />
              <Row label="Teléfono" value={String(d["phone"] ?? "—")} />
              <Row label="Dirección" value={String(d["address"] ?? "—")} />
            </div>
          </div>
          <div className="hub-card p-6">
            <p className="hub-eyebrow">Condiciones comerciales</p>
            <div className="mt-3">
              <LevelBadge code={String(d["level_code"])} />
            </div>
            <div className="mt-4">
              <Row label="Nivel" value={level?.name ?? "—"} />
              <Row label="Descuento" value={`${Number(level?.discount_pct ?? 0)}%`} />
              <Row label="Ejecutivo asignado" value={seller?.name ?? "Por asignar"} />
              <Row
                label="Compras acumuladas"
                value={money(Number(d["accumulated_purchases"] ?? 0))}
              />
            </div>
            <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground">
              Los campos sensibles (nivel, descuento y ejecutivo) se administran desde TÖHÖ.
              Solicita cualquier cambio a tu ejecutivo comercial.
            </p>
          </div>
        </div>
      )}
    </HubShell>
  );
}
