import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Pencil, Power, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/hub/Badges";
import { stockTone } from "@/components/hub/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { adminGetProduct, adminProductAction, adminSaveProduct } from "@/lib/catalog.functions";
import { money2 } from "@/lib/format";
import { STOCK_LABEL } from "@/lib/pricing";

type Row = Record<string, any>;

export function ProductsTab({ data }: { data: Row | undefined }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(adminSaveProduct);
  const actionFn = useServerFn(adminProductAction);
  const getFn = useServerFn(adminGetProduct);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);

  const products = (data?.["products"] ?? []) as Row[];
  const brands = (data?.["brands"] ?? []) as Row[];
  const categories = (data?.["categories"] ?? []) as Row[];

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) => String(p["name"]).toLowerCase().includes(t) || String(p["sku"]).toLowerCase().includes(t),
    );
  }, [products, search]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-catalog"] });

  const action = useMutation({
    mutationFn: (v: { id: string; action: "duplicate" | "toggle" | "delete" }) => actionFn({ data: v }),
    onSuccess: () => {
      toast.success("Listo");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => saveFn({ data: payload as never }),
    onSuccess: () => {
      toast.success("Producto guardado");
      setEditingId(undefined);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: editing } = useQuery({
    queryKey: ["admin-product", editingId],
    queryFn: () => getFn({ data: { id: editingId as string } }),
    enabled: Boolean(editingId),
  });

  const open = editingId !== undefined;
  const product = editingId ? ((editing?.product ?? null) as Row | null) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o SKU"
          className="max-w-xs"
        />
        <Button size="sm" onClick={() => setEditingId(null)}>
          Nuevo producto
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} productos</span>
      </div>

      <div className="hub-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-left">Marca</th>
              <th className="p-3 text-right">Precio lista</th>
              <th className="p-3 text-center">Inventario</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={String(p["id"])} className="border-t border-border">
                <td className="p-3">
                  <p className="font-medium">{String(p["name"])}</p>
                  <p className="text-xs text-muted-foreground">SKU {String(p["sku"])}</p>
                </td>
                <td className="p-3 text-muted-foreground">{p["brand"]?.name ?? "—"}</td>
                <td className="p-3 text-right">{money2(p["list_price"])}</td>
                <td className="p-3 text-center">
                  <StatusBadge
                    label={`${p["stock"]} · ${STOCK_LABEL[String(p["stock_status"])]}`}
                    tone={stockTone(String(p["stock_status"]))}
                  />
                </td>
                <td className="p-3 text-center text-xs">
                  {p["active"] ? "Activo" : "Inactivo"}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingId(String(p["id"]))}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => action.mutate({ id: String(p["id"]), action: "duplicate" })}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => action.mutate({ id: String(p["id"]), action: "toggle" })}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("¿Eliminar este producto?"))
                          action.mutate({ id: String(p["id"]), action: "delete" });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">Sin productos.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => !o && setEditingId(undefined)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          {editingId && !product ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <ProductForm
              product={product}
              brands={brands}
              categories={categories}
              saving={save.isPending}
              onSubmit={(payload) => save.mutate(payload)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({
  product,
  brands,
  categories,
  saving,
  onSubmit,
}: {
  product: Row | null;
  brands: Row[];
  categories: Row[];
  saving: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const [mainImage, setMainImage] = useState<string>(String(product?.["main_image"] ?? ""));
  const [preview, setPreview] = useState<string | null>(product?.["main_image_url"] ?? null);
  const [uploading, setUploading] = useState(false);
  const [active, setActive] = useState(Boolean(product?.["active"] ?? true));
  const [isNew, setIsNew] = useState(Boolean(product?.["is_new"] ?? false));
  const [featured, setFeatured] = useState(Boolean(product?.["featured"] ?? false));

  const parents = categories.filter((c) => !c["parent_id"]);
  const subs = categories.filter((c) => c["parent_id"]);

  async function upload(file: File) {
    setUploading(true);
    const path = `products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]+/g, "-")}`;
    const { error } = await supabase.storage.from("product-media").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setMainImage(path);
      const { data } = await supabase.storage.from("product-media").createSignedUrl(path, 3600);
      setPreview(data?.signedUrl ?? null);
      toast.success("Imagen cargada");
    }
    setUploading(false);
  }

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const features = String(f.get("features") ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        const specs: Record<string, string> = {};
        String(f.get("specs") ?? "")
          .split("\n")
          .forEach((line) => {
            const [k, ...rest] = line.split(":");
            if (k && rest.length) specs[k.trim()] = rest.join(":").trim();
          });
        onSubmit({
          id: product?.["id"] ?? null,
          sku: f.get("sku"),
          name: f.get("name"),
          brand_id: f.get("brand_id") || null,
          category_id: f.get("category_id") || null,
          subcategory_id: f.get("subcategory_id") || null,
          list_price: Number(f.get("list_price") ?? 0),
          stock: Number(f.get("stock") ?? 0),
          stock_status: f.get("stock_status"),
          short_description: f.get("short_description") || null,
          description: f.get("description") || null,
          extra_info: f.get("extra_info") || null,
          video_url: f.get("video_url") || null,
          main_image: mainImage || null,
          features,
          specs,
          is_new: isNew,
          featured,
          active,
          sort_order: Number(f.get("sort_order") ?? 0),
          images: [],
        });
      }}
    >
      <F name="sku" label="SKU" defaultValue={product?.["sku"]} required />
      <F name="name" label="Nombre" defaultValue={product?.["name"]} required />
      <Select name="brand_id" label="Marca" defaultValue={product?.["brand_id"]} options={brands} />
      <Select
        name="category_id"
        label="Categoría"
        defaultValue={product?.["category_id"]}
        options={parents}
      />
      <Select
        name="subcategory_id"
        label="Subcategoría"
        defaultValue={product?.["subcategory_id"]}
        options={subs}
      />
      <F
        name="list_price"
        label="Precio lista (MXN)"
        type="number"
        step="0.01"
        defaultValue={product?.["list_price"] ?? 0}
        required
      />
      <F name="stock" label="Inventario" type="number" defaultValue={product?.["stock"] ?? 0} />
      <div className="space-y-1.5">
        <Label>Estado de inventario</Label>
        <select
          name="stock_status"
          defaultValue={String(product?.["stock_status"] ?? "available")}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          {Object.entries(STOCK_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <F name="sort_order" label="Orden" type="number" defaultValue={product?.["sort_order"] ?? 0} />
      <F name="video_url" label="URL de video" defaultValue={product?.["video_url"]} />

      <div className="space-y-1.5 sm:col-span-2">
        <Label>Imagen principal</Label>
        <div className="flex items-center gap-3">
          {preview && <img src={preview} alt="" className="h-16 w-16 rounded-lg object-cover" />}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm">
            <Upload className="h-4 w-4" />
            {uploading ? "Subiendo…" : "Subir imagen"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />
          </label>
          <Input
            value={mainImage}
            onChange={(e) => setMainImage(e.target.value)}
            placeholder="o pega una URL https://…"
          />
        </div>
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="short_description">Descripción corta</Label>
        <Input
          id="short_description"
          name="short_description"
          defaultValue={product?.["short_description"] ?? ""}
        />
      </div>
      <TA name="description" label="Descripción" defaultValue={product?.["description"]} />
      <TA
        name="features"
        label="Características (una por línea)"
        defaultValue={(product?.["features"] ?? []).join("\n")}
      />
      <TA
        name="specs"
        label="Especificaciones (Clave: valor por línea)"
        defaultValue={Object.entries((product?.["specs"] ?? {}) as Record<string, string>)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")}
      />
      <TA name="extra_info" label="Información adicional" defaultValue={product?.["extra_info"]} />

      <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
        <Toggle label="Activo" checked={active} onChange={setActive} />
        <Toggle label="Nuevo" checked={isNew} onChange={setIsNew} />
        <Toggle label="Destacado" checked={featured} onChange={setFeatured} />
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" className="w-full" disabled={saving || uploading}>
          Guardar producto
        </Button>
      </div>
    </form>
  );
}

function F({
  name,
  label,
  defaultValue,
  ...rest
}: {
  name: string;
  label: string;
  defaultValue?: unknown;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={(defaultValue ?? "") as string} {...rest} />
    </div>
  );
}

function TA({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: unknown;
}) {
  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} rows={4} defaultValue={(defaultValue ?? "") as string} />
    </div>
  );
}

function Select({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: unknown;
  options: Row[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select
        name={name}
        defaultValue={(defaultValue ?? "") as string}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
      >
        <option value="">Sin asignar</option>
        {options.map((o) => (
          <option key={String(o["id"])} value={String(o["id"])}>
            {String(o["name"])}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <Switch checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}
