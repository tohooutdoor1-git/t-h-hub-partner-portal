import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HubLogo } from "@/components/hub/HubShell";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { adminExists, createFirstAdmin } from "@/lib/hub.functions";
import { ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TÖHÖ HUB — Portal exclusivo de distribuidores" },
      {
        name: "description",
        content:
          "Acceso al portal B2B de distribuidores TÖHÖ: catálogo premium, niveles, descuentos y cotizaciones.",
      },
      { property: "og:title", content: "TÖHÖ HUB — Portal exclusivo de distribuidores" },
      {
        property: "og:description",
        content: "Catálogo premium, niveles, descuentos y cotizaciones para distribuidores TÖHÖ.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "recover">("login");
  const [needsSetup, setNeedsSetup] = useState(false);
  const checkAdmin = useServerFn(adminExists);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    checkAdmin().then((r) => setNeedsSetup(!r.exists));
  }, [navigate, checkAdmin]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "recover") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Te enviamos un correo para restablecer tu contraseña.");
        setMode("login");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No fue posible iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
            TÖ
          </div>
          <span className="font-display text-base font-semibold">TÖHÖ HUB</span>
        </div>
        <div className="relative max-w-md">
          <p className="hub-eyebrow text-primary">Portal exclusivo de distribuidores</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">
            Tu centro digital de operaciones TÖHÖ.
          </h2>
          <p className="mt-4 text-sm leading-relaxed opacity-70">
            Consulta tu nivel, descuentos y compras acumuladas. Explora el catálogo, arma tu
            cotización y envíala directo a tu ejecutivo comercial.
          </p>
        </div>
        <div className="relative flex gap-8 text-xs opacity-60">
          <span>Catálogo premium</span>
          <span>Niveles y descuentos</span>
          <span>Cotizaciones</span>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <HubLogo />
          </div>
          <h1 className="mt-8 font-display text-2xl font-semibold lg:mt-0">
            {mode === "login" ? "Iniciar sesión" : "Recuperar acceso"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Accede con las credenciales que TÖHÖ creó para tu empresa."
              : "Te enviaremos un enlace para restablecer tu contraseña."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
              />
            </div>
            {mode === "login" && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Entrar al Hub" : "Enviar enlace"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "recover" : "login")}
            className="mt-5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            {mode === "login" ? "¿Olvidaste tu contraseña?" : "Volver a iniciar sesión"}
          </button>

          <p className="mt-10 rounded-xl bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            El acceso a TÖHÖ HUB es exclusivo para distribuidores autorizados. Las cuentas se crean
            únicamente desde el panel administrativo de TÖHÖ.
          </p>

          {needsSetup && <FirstAdminForm onDone={() => setNeedsSetup(false)} />}
        </div>
      </div>
    </div>
  );
}

function FirstAdminForm({ onDone }: { onDone: () => void }) {
  const create = useServerFn(createFirstAdmin);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="mt-6 space-y-3 rounded-2xl border border-dashed border-primary/40 bg-primary-soft/60 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setLoading(true);
        try {
          await create({
            data: {
              full_name: String(f.get("full_name")),
              email: String(f.get("email")),
              password: String(f.get("password")),
            },
          });
          toast.success("Cuenta TÖHÖ creada. Ya puedes iniciar sesión.");
          onDone();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "No se pudo crear la cuenta");
        } finally {
          setLoading(false);
        }
      }}
    >
      <p className="hub-eyebrow">Configuración inicial</p>
      <p className="text-xs text-muted-foreground">
        Aún no existe una cuenta administradora. Crea la primera cuenta del equipo TÖHÖ.
      </p>
      <Input name="full_name" placeholder="Nombre" required />
      <Input name="email" type="email" placeholder="admin@toho.com.mx" required />
      <Input name="password" type="password" placeholder="Contraseña (mín. 8)" required minLength={8} />
      <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
        Crear cuenta administradora
      </Button>
    </form>
  );
}
