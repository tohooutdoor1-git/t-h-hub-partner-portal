import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hub/ComingSoon";

export const Route = createFileRoute("/_authenticated/cotizaciones")({
  head: () => ({
    meta: [
      { title: "Cotizaciones — TÖHÖ HUB" },
      { name: "description", content: "Historial completo de cotizaciones con estados, duplicado y descarga en PDF." },
      { property: "og:title", content: "Cotizaciones — TÖHÖ HUB" },
      { property: "og:description", content: "Historial completo de cotizaciones con estados, duplicado y descarga en PDF." },
    ],
  }),
  component: Cotizaciones,
});

function Cotizaciones() {
  return (
    <ComingSoon
      title="Cotizaciones"
      phase="Disponible en Fase 4"
      description="Historial completo de cotizaciones con estados, duplicado y descarga en PDF."
    />
  );
}
