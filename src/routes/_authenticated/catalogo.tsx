import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/hub/ComingSoon";

export const Route = createFileRoute("/_authenticated/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo — TÖHÖ HUB" },
      { name: "description", content: "Catálogo visual premium con marcas, categorías, filtros, búsqueda y tarjetas editoriales." },
      { property: "og:title", content: "Catálogo — TÖHÖ HUB" },
      { property: "og:description", content: "Catálogo visual premium con marcas, categorías, filtros, búsqueda y tarjetas editoriales." },
    ],
  }),
  component: Catalogo,
});

function Catalogo() {
  return (
    <ComingSoon
      title="Catálogo"
      phase="Disponible en Fase 3"
      description="Catálogo visual premium con marcas, categorías, filtros, búsqueda y tarjetas editoriales."
    />
  );
}
