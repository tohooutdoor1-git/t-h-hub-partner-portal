import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hub/ComingSoon";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — TÖHÖ HUB" },
      { name: "description", content: "Los productos que marques como favoritos aparecerán aquí." },
      { property: "og:title", content: "Favoritos — TÖHÖ HUB" },
      { property: "og:description", content: "Los productos que marques como favoritos aparecerán aquí." },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  return (
    <ComingSoon
      title="Favoritos"
      phase="Disponible en Fase 3"
      description="Los productos que marques como favoritos aparecerán aquí."
    />
  );
}
