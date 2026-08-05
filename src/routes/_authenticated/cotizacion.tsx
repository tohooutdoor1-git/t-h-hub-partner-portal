import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hub/ComingSoon";

export const Route = createFileRoute("/_authenticated/cotizacion")({
  head: () => ({
    meta: [
      { title: "Mi cotización — TÖHÖ HUB" },
      { name: "description", content: "Carrito de cotización con cantidades, ahorro, comentarios y envío a tu ejecutivo." },
      { property: "og:title", content: "Mi cotización — TÖHÖ HUB" },
      { property: "og:description", content: "Carrito de cotización con cantidades, ahorro, comentarios y envío a tu ejecutivo." },
    ],
  }),
  component: Cotizacion,
});

function Cotizacion() {
  return (
    <ComingSoon
      title="Mi cotización"
      phase="Disponible en Fase 4"
      description="Carrito de cotización con cantidades, ahorro, comentarios y envío a tu ejecutivo."
    />
  );
}
