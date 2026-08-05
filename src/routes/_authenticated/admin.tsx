import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { HubShell } from "@/components/hub/HubShell";
import { LevelBadge } from "@/components/hub/Badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMe } from "@/hooks/useMe";
import {
  adminListDistributors,
  adminCreateDistributor,
  adminUpdateDistributor,
  adminSaveLevel,
  adminSaveSeller,
} from "@/lib/hub.functions";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel administrativo — TÖHÖ HUB" },
      {
        name: "description",
        content: "Gestión de distribuidores, vendedores y niveles del programa TÖHÖ.",
      },
      { property: "og:title", content: "Panel administrativo — TÖHÖ HUB" },
      { property: "og:description", content: "Gestión interna de TÖHÖ HUB." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { data: me } = useMe();
  const listFn = useServerFn(adminListDistributors);
  const createFn = useServerFn(adminCreateDistributor);
  const updateFn = useServerFn(adminUpdateDistributor);
  const levelFn = useServerFn(adminSaveLevel);
  const sellerFn = useServerFn(adminSaveSeller);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const isAdmin = me?.roles.includes("admin") ?? false;

  const { data } = useQuery({
    queryKey: ["admin-distributors"],
    queryFn: () => listFn(),
    enabled: isAdmin,
  });

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createFn({ data: payload as never }),
    onSuccess: () => {
      toast.success("Distribuidor creado");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-distributors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateFn({ data: payload as never }),
    onSuccess: () => {
      toast.success("Distribuidor actualizado");
      qc.invalidateQueries({ queryKey: ["admin-distributors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveLevel = useMutation({
    mutationFn: (payload: Record<string, unknown>) => levelFn({ data: payload as never }),
    onSuccess: () => {
      toast.success("Nivel actualizado");
      qc.invalidateQueries({ queryKey: ["admin-distributors"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveSeller = useMutation({
    mutationFn: (payload: Record<string, unknown>) => sellerFn({ data: payload as never }),
    onSuccess: () => {
      toast.success("Vendedor guardado");
      qc.invalidateQueries({ queryKey: ["admin-distributors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <HubShell title="Panel administrativo">
        <div className="hub-card p-8 text-center text-sm text-muted-foreground">
          Esta sección es exclusiva del equipo TÖHÖ.
        </div>
      </HubShell>
    );
  }

  const distributors = (data?.distributors ?? []) as Array<Record<string, never>>;
  const sellers = (data?.sellers ?? []) as Array<Record<string, never>>;
  const levels = (data?.levels ?? []) as Array<Record<string, never>>;

  return (
    <HubShell
      isAdmin
      title="Panel administrativo"
      subtitle="Distribuidores, vendedores y niveles"
      right={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Nuevo distribuidor</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear distribuidor</DialogTitle>
            </DialogHeader>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                create.mutate({
                  contact_name: f.get("contact_name"),
                  company: f.get("company"),
                  rfc: f.get("rfc"),
                  email: f.get("email"),
                  phone: f.get("phone"),
                  address: f.get("address"),
                  level_code: f.get("level_code"),
                  seller_id: f.get("seller_id") || null,
                  password: f.get("password"),
                });
              }}
            >
              <Field name="contact_name" label="Nombre" required />
              <Field name="company" label="Empresa" required />
              <Field name="rfc" label="RFC" />
              <Field name="email" label="Email" type="email" required />
              <Field name="phone" label="Teléfono" />
              <Field name="address" label="Dirección" />
              <div className="space-y-1.5">
                <Label>Nivel</Label>
                <select
                  name="level_code"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {levels.map((l) => (
                    <option key={String(l["code"])} value={String(l["code"])}>
                      {String(l["name"])}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Vendedor</Label>
                <select
                  name="seller_id"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sin asignar</option>
                  {sellers.map((s) => (
                    <option key={String(s["id"])} value={String(s["id"])}>
                      {String(s["name"])}
                    </option>
                  ))}
                </select>
              </div>
              <Field name="password" label="Contraseña" type="password" required />
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full" disabled={create.isPending}>
                  Crear cuenta
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <Tabs defaultValue="distribuidores">
        <TabsList>
          <TabsTrigger value="distribuidores">Distribuidores</TabsTrigger>
          <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
          <TabsTrigger value="niveles">Niveles</TabsTrigger>
        </TabsList>

        <TabsContent value="distribuidores" className="mt-5">
          <div className="hub-card overflow-hidden">
            {distributors.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Aún no hay distribuidores registrados.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {distributors.map((d) => (
                  <li key={String(d["id"])} className="flex flex-wrap items-center gap-3 p-5">
                    <div className="min-w-52 flex-1">
                      <p className="font-medium">{String(d["company"])}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(d["contact_name"])} · {String(d["email"])} ·{" "}
                        {shortDate(String(d["created_at"]))}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {money(Number(d["accumulated_purchases"]))}
                    </p>
                    <LevelBadge code={String(d["level_code"])} />
                    <select
                      defaultValue={String(d["level_code"])}
                      onChange={(e) =>
                        update.mutate({ id: d["id"], level_code: e.target.value })
                      }
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                    >
                      {levels.map((l) => (
                        <option key={String(l["code"])} value={String(l["code"])}>
                          {String(l["name"])}
                        </option>
                      ))}
                    </select>
                    <select
                      defaultValue={d["seller_id"] ? String(d["seller_id"]) : ""}
                      onChange={(e) =>
                        update.mutate({ id: d["id"], seller_id: e.target.value || null })
                      }
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                    >
                      <option value="">Sin vendedor</option>
                      {sellers.map((s) => (
                        <option key={String(s["id"])} value={String(s["id"])}>
                          {String(s["name"])}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        update.mutate({ id: d["id"], active: !(d["active"] as unknown as boolean) })
                      }
                    >
                      {d["active"] ? "Desactivar" : "Reactivar"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="vendedores" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="hub-card divide-y divide-border">
              {sellers.map((s) => (
                <div key={String(s["id"])} className="flex items-center gap-3 p-5">
                  <div className="flex-1">
                    <p className="font-medium">{String(s["name"])}</p>
                    <p className="text-xs text-muted-foreground">{String(s["email"] ?? "")}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      saveSeller.mutate({
                        id: s["id"],
                        name: s["name"],
                        email: s["email"],
                        phone: s["phone"],
                        whatsapp: s["whatsapp"],
                        active: !(s["active"] as unknown as boolean),
                      })
                    }
                  >
                    {s["active"] ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              ))}
            </div>
            <form
              className="hub-card space-y-3 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                saveSeller.mutate({
                  name: f.get("name"),
                  email: f.get("email"),
                  phone: f.get("phone"),
                  whatsapp: f.get("whatsapp"),
                  active: true,
                });
                e.currentTarget.reset();
              }}
            >
              <p className="hub-eyebrow">Nuevo vendedor</p>
              <Field name="name" label="Nombre" required />
              <Field name="email" label="Email" type="email" />
              <Field name="phone" label="Teléfono" />
              <Field name="whatsapp" label="WhatsApp" />
              <Button type="submit" className="w-full">
                Guardar vendedor
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="niveles" className="mt-5">
          <div className="grid gap-5 sm:grid-cols-3">
            {levels.map((l) => (
              <form
                key={String(l["code"])}
                className="hub-card space-y-3 p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  saveLevel.mutate({
                    code: l["code"],
                    discount_pct: Number(f.get("discount_pct")),
                    threshold: Number(f.get("threshold")),
                  });
                }}
              >
                <LevelBadge code={String(l["code"])} />
                <div className="space-y-1.5">
                  <Label>Descuento (%)</Label>
                  <Input
                    name="discount_pct"
                    type="number"
                    step="0.5"
                    defaultValue={String(l["discount_pct"])}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Meta de compras acumuladas</Label>
                  <Input name="threshold" type="number" defaultValue={String(l["threshold"])} />
                </div>
                <Button type="submit" variant="outline" className="w-full">
                  Guardar
                </Button>
              </form>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </HubShell>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
