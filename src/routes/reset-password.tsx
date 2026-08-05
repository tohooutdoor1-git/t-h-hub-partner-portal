import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HubLogo } from "@/components/hub/HubShell";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Restablecer contraseña — TÖHÖ HUB" },
      { name: "description", content: "Define una nueva contraseña para tu cuenta de TÖHÖ HUB." },
      { property: "og:title", content: "Restablecer contraseña — TÖHÖ HUB" },
      { property: "og:description", content: "Define una nueva contraseña para tu cuenta." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Contraseña actualizada");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <HubLogo />
        <h1 className="mt-8 font-display text-2xl font-semibold">Nueva contraseña</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Abre este enlace desde el correo de recuperación para continuar.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw">Contraseña</Label>
              <Input
                id="pw"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar contraseña
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
