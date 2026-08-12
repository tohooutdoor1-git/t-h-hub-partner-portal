import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { HubShell } from "@/components/hub/HubShell";
import { ProductCard, type CatalogProduct } from "@/components/hub/ProductCard";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { useCartActions } from "@/hooks/useCart";
import { listFavorites, toggleFavorite } from "@/lib/hub-content.functions";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — TÖHÖ HUB" },
      { name: "description", content: "Los productos que marques como favoritos aparecerán aquí." },
      { property: "og:title", content: "Favoritos — TÖHÖ HUB" },
      { property: "og:description", content: "Tus productos guardados con precio de distribuidor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const listFn = useServerFn(listFavorites);
  const toggleFn = useServerFn(toggleFavorite);
  const { add } = useCartActions();

  const { data, isLoading } = useQuery({ queryKey: ["favorites"], queryFn: () => listFn() });

  const remove = useMutation({
    mutationFn: (product_id: string) => toggleFn({ data: { product_id } }),
    onSuccess: () => {
      toast.success("Producto quitado de favoritos");
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const favorites = (data?.favorites ?? []) as Array<CatalogProduct & { favorite_id: string }>;
  const discount = Number(data?.discount_pct ?? 0);

  return (
    <HubShell
      isAdmin={me?.roles.includes("admin") ?? false}
      isSeller={me?.roles.includes("seller") ?? false}
      title="Favoritos"
      subtitle="Productos guardados con tu precio de distribuidor"
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="hub-card mx-auto max-w-md p-10 text-center">
          <Heart className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-lg font-semibold">Aún no tienes favoritos</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Marca productos con el corazón desde el catálogo para tenerlos siempre a la mano.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {favorites.map((p) => (
            <div key={p.favorite_id} className="space-y-2">
              <ProductCard
                product={p}
                discountPct={discount}
                onOpen={() => {}}
                onQuickAdd={() => add.mutate({ product_id: p.id, quantity: 1 })}
                adding={add.isPending}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => remove.mutate(p.id)}
              >
                <Heart className="mr-1 h-4 w-4 fill-current" /> Quitar de favoritos
              </Button>
            </div>
          ))}
        </div>
      )}
    </HubShell>
  );
}
