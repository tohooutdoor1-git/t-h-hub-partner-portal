import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Package,
  Heart,
  Tag,
  FolderOpen,
  User,
  ShieldCheck,
  Menu,
  LogOut,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/catalogo", label: "Catálogo", icon: BookOpen },
  { to: "/cotizacion", label: "Mi cotización", icon: FileText },
  { to: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { to: "/pedidos", label: "Pedidos", icon: Package },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/promociones", label: "Promociones", icon: Tag },
  { to: "/recursos", label: "Recursos", icon: FolderOpen },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function HubLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-sm font-bold">
        TÖ
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="font-display text-base font-semibold tracking-tight">TÖHÖ</p>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-primary">
            Hub
          </p>
        </div>
      )}
    </div>
  );
}

function NavList({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            {item.label}
          </Link>
        );
      })}
      {isAdmin && (
        <>
          <p className="hub-eyebrow mt-6 px-3">TÖHÖ interno</p>
          <Link
            to="/admin"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Panel administrativo
          </Link>
        </>
      )}
    </nav>
  );
}

export function HubShell({
  children,
  isAdmin = false,
  title,
  subtitle,
  right,
}: {
  children: ReactNode;
  isAdmin?: boolean;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <div className="px-2">
          <HubLogo />
        </div>
        <div className="mt-8 flex-1 overflow-y-auto">
          <NavList isAdmin={isAdmin} />
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/85 px-5 py-4 backdrop-blur-md lg:px-10">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="lg:hidden" aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-5">
              <HubLogo />
              <div className="mt-8">
                <NavList isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold sm:text-xl">{title}</h1>
            {subtitle && (
              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {right}
        </header>
        <main className="px-5 py-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
