import { createFileRoute } from "@tanstack/react-router";
import { HubShell } from "@/components/hub/HubShell";
import { StaffQuotesTab } from "@/components/admin/StaffQuotesTab";
import { useMe } from "@/hooks/useMe";

export const Route = createFileRoute("/_authenticated/ventas")({
  head: () => ({
    meta: [
      { title: "Panel de ventas — TÖHÖ HUB" },
      {
        name: "description",
        content:
          "Panel del ejecutivo TÖHÖ: revisa cotizaciones de tus distribuidores, aprueba y convierte en pedidos.",
      },
      { property: "og:title", content: "Panel de ventas — TÖHÖ HUB" },
      {
        property: "og:description",
        content: "Gestiona cotizaciones y pedidos de tus distribuidores asignados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VentasPage,
});

function VentasPage() {
  const { data: me } = useMe();
  const roles = me?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const isSeller = roles.includes("seller");

  if (me && !isAdmin && !isSeller) {
    return (
      <HubShell title="Panel de ventas">
        <p className="hub-card p-8 text-center text-sm text-muted-foreground">
          Esta sección es exclusiva del equipo comercial TÖHÖ.
        </p>
      </HubShell>
    );
  }

  return (
    <HubShell
      isAdmin={isAdmin}
      isSeller={isSeller}
      title="Panel de ventas"
      subtitle="Cotizaciones y pedidos de tus distribuidores asignados"
    >
      <StaffQuotesTab />
    </HubShell>
  );
}
