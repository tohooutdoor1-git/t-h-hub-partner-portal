import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hub/ComingSoon";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos — TÖHÖ HUB" },
      { name: "description", content: "Seguimiento de pedidos confirmados y su flujo de estados hasta la entrega." },
      { property: "og:title", content: "Pedidos — TÖHÖ HUB" },
      { property: "og:description", content: "Seguimiento de pedidos confirmados y su flujo de estados hasta la entrega." },
    ],
  }),
  component: Pedidos,
});

function Pedidos() {
  return (
    <ComingSoon
      title="Pedidos"
      phase="Disponible en Fase 5"
      description="Seguimiento de pedidos confirmados y su flujo de estados hasta la entrega."
    />
  );
}
