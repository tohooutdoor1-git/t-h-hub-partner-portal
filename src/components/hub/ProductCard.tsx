import { ImageOff, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/hub/Badges";
import { money2 } from "@/lib/format";
import { discountedPrice, STOCK_LABEL } from "@/lib/pricing";

export type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  short_description?: string | null;
  list_price: number;
  stock_status: string;
  main_image?: string | null;
  is_new?: boolean;
  featured?: boolean;
  brand?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
};

export function stockTone(status: string) {
  if (status === "available") return "success" as const;
  if (status === "low") return "warning" as const;
  if (status === "out") return "danger" as const;
  return "info" as const;
}

export function ProductImage({
  src,
  alt,
  className = "aspect-[4/3]",
}: {
  src?: string | null | undefined;
  alt: string;
  className?: string | undefined;
}) {
  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-muted ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-muted-foreground">
          <ImageOff className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}

export function ProductCard({
  product,
  discountPct,
  onOpen,
  onQuickAdd,
  adding,
}: {
  product: CatalogProduct;
  discountPct: number;
  onOpen: () => void;
  onQuickAdd: () => void;
  adding?: boolean;
}) {
  const price = discountedPrice(Number(product.list_price), discountPct);
  const soldOut = product.stock_status === "out";

  return (
    <article className="hub-card group flex flex-col overflow-hidden p-3 transition-shadow hover:shadow-lg">
      <button type="button" onClick={onOpen} className="text-left">
        <div className="relative">
          <ProductImage src={product.main_image} alt={product.name} />
          <div className="absolute left-2 top-2 flex gap-1.5">
            {product.is_new && <StatusBadge label="Nuevo" tone="info" />}
            {product.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                <Sparkles className="h-3 w-3" /> Destacado
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <p className="hub-eyebrow">{product.brand?.name ?? "TÖHÖ"}</p>
          <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground">SKU {product.sku}</p>
        </div>
      </button>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground line-through">
            {money2(product.list_price)}
          </p>
          <p className="font-display text-base font-semibold text-primary">{money2(price)}</p>
        </div>
        <StatusBadge
          label={STOCK_LABEL[product.stock_status] ?? product.stock_status}
          tone={stockTone(product.stock_status)}
        />
      </div>

      <Button
        size="sm"
        className="mt-3 w-full"
        variant={soldOut ? "secondary" : "default"}
        disabled={soldOut || adding}
        onClick={onQuickAdd}
      >
        <Plus className="h-4 w-4" />
        {soldOut ? "Agotado" : "Agregar a cotización"}
      </Button>
    </article>
  );
}
