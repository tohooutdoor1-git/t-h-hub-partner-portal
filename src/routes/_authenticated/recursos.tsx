import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileText, FolderOpen } from "lucide-react";
import { HubShell } from "@/components/hub/HubShell";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { listResources } from "@/lib/hub-content.functions";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/recursos")({
  head: () => ({
    meta: [
      { title: "Recursos — TÖHÖ HUB" },
      {
        name: "description",
        content: "Fichas técnicas, catálogos y materiales de marca para distribuidores TÖHÖ.",
      },
      { property: "og:title", content: "Recursos — TÖHÖ HUB" },
      { property: "og:description", content: "Material comercial descargable para distribuidores TÖHÖ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Recursos,
});

type Row = Record<string, any>;

function Recursos() {
  const { data: me } = useMe();
  const listFn = useServerFn(listResources);
  const { data, isLoading } = useQuery({ queryKey: ["resources"], queryFn: () => listFn() });

  const categories = (data?.categories ?? []) as Row[];
  const resources = (data?.resources ?? []) as Row[];
  const groups = [
    ...categories.map((c) => ({
      id: String(c["id"]),
      name: String(c["name"]),
      items: resources.filter((r) => String(r["category_id"]) === String(c["id"])),
    })),
    {
      id: "sin-categoria",
      name: "Otros materiales",
      items: resources.filter((r) => !r["category_id"]),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <HubShell
      isAdmin={me?.roles.includes("admin") ?? false}
      isSeller={me?.roles.includes("seller") ?? false}
      title="Recursos"
      subtitle="Fichas técnicas, catálogos y material de marca"
    >
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : groups.length === 0 ? (
        <div className="hub-card mx-auto max-w-md p-10 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-lg font-semibold">Aún no hay materiales</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            El equipo TÖHÖ publicará aquí fichas técnicas, catálogos PDF y material de marca.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.id}>
              <h2 className="font-display text-lg font-semibold">{g.name}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((r) => (
                  <article key={String(r["id"])} className="hub-card flex flex-col p-4">
                    {r["thumbnail_url"] ? (
                      <img
                        src={String(r["thumbnail_url"])}
                        alt={String(r["title"])}
                        loading="lazy"
                        className="aspect-[4/3] w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="grid aspect-[4/3] w-full place-items-center rounded-xl bg-muted text-muted-foreground">
                        <FileText className="h-7 w-7" />
                      </div>
                    )}
                    <h3 className="mt-3 font-display text-sm font-semibold">{String(r["title"])}</h3>
                    {r["description"] && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {String(r["description"])}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(r["file_type"] ?? "Archivo").toUpperCase()} ·{" "}
                      {shortDate(String(r["created_at"]))}
                    </p>
                    <Button asChild size="sm" variant="outline" className="mt-3">
                      <a href={String(r["file_url"])} target="_blank" rel="noreferrer">
                        <Download className="mr-1 h-4 w-4" /> Descargar
                      </a>
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </HubShell>
  );
}
