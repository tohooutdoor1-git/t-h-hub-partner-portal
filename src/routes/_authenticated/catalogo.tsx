import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { HubShell } from "@/components/hub/HubShell";
import { ProductCard, type CatalogProduct } from "@/components/hub/ProductCard";
import { ProductDialog } from "@/components/hub/ProductDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/useMe";
import { useCartActions } from "@/hooks/useCart";
import { getCatalog } from "@/lib/catalog.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo — TÖHÖ HUB" },
      {
        name: "description",
        content:
          "Catálogo visual premium TÖHÖ: marcas, categorías, filtros y precios de distribuidor por nivel.",
      },
      { property: "og:title", content: "Catálogo — TÖHÖ HUB" },
      {
        property: "og:description",
        content: "Explora el catálogo TÖHÖ y arma tu cotización en minutos.",
      },
    ],
  }),
  component: Catalogo,
});

const SORTS = [
  { value: "manual", label: "Recomendado" },
  { value: "featured", label: "Destacados" },
  { value: "newest", label: "Novedades" },
  { value: "top", label: "Más cotizados" },
  { value: "price_asc", label: "Precio menor" },
  { value: "price_desc", label: "Precio mayor" },
  { value: "name_asc", label: "Nombre A-Z" },
] as const;

function Catalogo() {
  const { data: me } = useMe();
  const fn = useServerFn(getCatalog);
  const { add } = useCartActions();

  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [brandId, setBrandId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<string>("manual");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const discountPct = Number((me?.distributor as any)?.level?.discount_pct ?? 0);

  const { data, isLoading } = useQuery({
    queryKey: ["catalog", term, brandId, categoryId, sort],
    queryFn: () =>
      fn({ data: { search: term, brand_id: brandId, category_id: categoryId, sort: sort as never } }),
  });

  const products = (data?.products ?? []) as unknown as CatalogProduct[];
  const brands = data?.brands ?? [];
  const banners = data?.banners ?? [];
  const categories = useMemo(
    () => (data?.categories ?? []).filter((c: any) => !c.parent_id),
    [data?.categories],
  );

  return (
    <HubShell
      isAdmin={me?.roles.includes("admin") ?? false}
      title="Catálogo"
      subtitle="Precios exclusivos de tu nivel de distribuidor"
    >
      {banners.length > 0 && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {banners.slice(0, 2).map((b: any) => (
            <div
              key={b.id}
              className="hub-card relative overflow-hidden p-0"
              style={{ minHeight: 160 }}
            >
              {b.image_url && (
                <img src={b.image_url} alt={b.title ?? "Banner TÖHÖ"} className="h-40 w-full object-cover" />
              )}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-5 text-white">
                <p className="font-display text-lg font-semibold">{b.title ?? "TÖHÖ"}</p>
                {b.subtitle && <p className="text-sm opacity-90">{b.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(search);
        }}
      >
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          className="md:hidden"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </form>

      <div className={cn("mt-4 space-y-3", !showFilters && "hidden md:block")}>
        <Chips
          label="Marcas"
          items={brands.map((b: any) => ({ id: b.id, name: b.name }))}
          value={brandId}
          onChange={setBrandId}
        />
        <Chips
          label="Categorías"
          items={categories.map((c: any) => ({ id: c.id, name: c.name }))}
          value={categoryId}
          onChange={setCategoryId}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-2xl" />
            ))
          : products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                discountPct={discountPct}
                onOpen={() => setOpenId(p.id)}
                onQuickAdd={() => add.mutate({ product_id: p.id, quantity: 1 })}
                adding={add.isPending}
              />
            ))}
      </div>

      {!isLoading && products.length === 0 && (
        <div className="hub-card mt-6 p-10 text-center text-sm text-muted-foreground">
          No encontramos productos con esos filtros.
        </div>
      )}

      <ProductDialog
        productId={openId}
        discountPct={discountPct}
        adding={add.isPending}
        onOpenChange={(o) => !o && setOpenId(null)}
        onAdd={(id, quantity) => {
          add.mutate({ product_id: id, quantity });
          setOpenId(null);
        }}
      />
    </HubShell>
  );
}

function Chips({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: Array<{ id: string; name: string }>;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="hub-eyebrow mr-1">{label}</span>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          value === null ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        Todas
      </button>
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => onChange(value === i.id ? null : i.id)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            value === i.id ? "border-primary bg-primary text-primary-foreground" : "border-border",
          )}
        >
          {i.name}
        </button>
      ))}
    </div>
  );
}
