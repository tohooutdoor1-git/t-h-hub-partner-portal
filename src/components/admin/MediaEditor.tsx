import { useState } from "react";
import { toast } from "sonner";
import { GripVertical, Star, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-media";

export type MediaItem = { key: string; path: string; url: string | null };

function isRemote(v: string) {
  return /^https?:\/\//i.test(v);
}

export async function uploadMedia(file: File, folder: string): Promise<MediaItem> {
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name
    .replace(/[^a-zA-Z0-9.]+/g, "-")
    .toLowerCase()}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return { key: path, path, url: data?.signedUrl ?? null };
}

/**
 * Gallery editor: multiple images with upload / delete / reorder (drag & drop)
 * and main-image selection. The first item is always the main image.
 */
export function GalleryEditor({
  items,
  onChange,
  min = 6,
}: {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  min?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [urlValue, setUrlValue] = useState("");

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading(true);
    setProgress({ done: 0, total: list.length });

    // Subida en paralelo (lotes de 4) para cargar varias imágenes de golpe.
    const results: MediaItem[] = [];
    const failed: string[] = [];
    const BATCH = 4;
    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH);
      const settled = await Promise.all(
        batch.map(async (file) => {
          try {
            return await uploadMedia(file, "products");
          } catch (e) {
            failed.push(`${file.name}: ${(e as Error).message}`);
            return null;
          }
        }),
      );
      settled.forEach((r) => r && results.push(r));
      setProgress((p) => ({ ...p, done: Math.min(p.total, i + batch.length) }));
    }

    if (results.length) {
      onChange([...items, ...results]);
      toast.success(`${results.length} imagen(es) cargada(s)`);
    }
    if (failed.length) toast.error(`No se pudieron subir ${failed.length}: ${failed[0]}`);
    setUploading(false);
    setProgress({ done: 0, total: 0 });
  }


  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= items.length) return;
    const copy = [...items];
    const [row] = copy.splice(from, 1);
    if (row) copy.splice(to, 0, row);
    onChange(copy);
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <Label>Galería de imágenes</Label>
        <span className="text-xs text-muted-foreground">
          {items.length} cargadas · recomendado mínimo {min}. Arrastra para ordenar; la primera es
          la principal.
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {items.map((item, i) => (
          <div
            key={item.key}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, i);
              setDragIndex(null);
            }}
            className={`group relative aspect-square overflow-hidden rounded-xl border ${
              i === 0 ? "border-primary ring-2 ring-primary/30" : "border-border"
            } bg-muted`}
          >
            {item.url ? (
              <img src={item.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center px-1 text-[10px] text-muted-foreground">
                {item.path.slice(0, 24)}
              </div>
            )}
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Principal
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-background/85 px-1 py-1 opacity-0 transition-opacity group-hover:opacity-100">
              <GripVertical className="h-3.5 w-3.5 cursor-grab text-muted-foreground" />
              <button
                type="button"
                title="Definir como principal"
                onClick={() => move(i, 0)}
                className="rounded p-0.5 hover:text-primary"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Eliminar"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="rounded p-0.5 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-input text-xs text-muted-foreground hover:border-primary hover:text-primary">
          <Upload className="h-4 w-4" />
          {uploading ? "Subiendo…" : "Subir"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="flex gap-2">
        <Input
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          placeholder="o pega una URL de imagen https://…"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const v = urlValue.trim();
            if (!v) return;
            onChange([...items, { key: `${v}-${Date.now()}`, path: v, url: isRemote(v) ? v : null }]);
            setUrlValue("");
          }}
        >
          Agregar
        </Button>
      </div>
    </div>
  );
}

/** Single video per product: upload to storage or paste an external URL. */
export function VideoEditor({
  value,
  display,
  onChange,
}: {
  value: string;
  display: string | null;
  onChange: (path: string, display: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>Video del producto</Label>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm hover:border-primary">
          <Upload className="h-4 w-4" />
          {uploading ? "Subiendo…" : "Subir video"}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setUploading(true);
              try {
                const item = await uploadMedia(file, "videos");
                onChange(item.path, item.url);
                toast.success("Video cargado");
              } catch (err) {
                toast.error((err as Error).message);
              }
              setUploading(false);
            }}
          />
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value, isRemote(e.target.value) ? e.target.value : null)}
          placeholder="o pega una URL de video (YouTube, Vimeo, mp4…)"
          className="max-w-md"
        />
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange("", null)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {display && !/youtube|youtu\.be|vimeo/i.test(display) && (
        <video src={display} controls className="mt-2 max-h-56 rounded-xl border border-border" />
      )}
    </div>
  );
}
