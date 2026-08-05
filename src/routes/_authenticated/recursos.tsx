import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hub/ComingSoon";

export const Route = createFileRoute("/_authenticated/recursos")({
  head: () => ({
    meta: [
      { title: "Centro de recursos — TÖHÖ HUB" },
      { name: "description", content: "Catálogos, fichas técnicas, imágenes, videos y material comercial." },
      { property: "og:title", content: "Centro de recursos — TÖHÖ HUB" },
      { property: "og:description", content: "Catálogos, fichas técnicas, imágenes, videos y material comercial." },
    ],
  }),
  component: Recursos,
});

function Recursos() {
  return (
    <ComingSoon
      title="Centro de recursos"
      phase="Disponible en Fase 6"
      description="Catálogos, fichas técnicas, imágenes, videos y material comercial."
    />
  );
}
