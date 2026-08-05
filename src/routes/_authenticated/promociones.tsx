import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hub/ComingSoon";

export const Route = createFileRoute("/_authenticated/promociones")({
  head: () => ({
    meta: [
      { title: "Promociones — TÖHÖ HUB" },
      { name: "description", content: "Promociones exclusivas para distribuidores TÖHÖ." },
      { property: "og:title", content: "Promociones — TÖHÖ HUB" },
      { property: "og:description", content: "Promociones exclusivas para distribuidores TÖHÖ." },
    ],
  }),
  component: Promociones,
});

function Promociones() {
  return (
    <ComingSoon
      title="Promociones"
      phase="Disponible en Fase 3"
      description="Promociones exclusivas para distribuidores TÖHÖ."
    />
  );
}
