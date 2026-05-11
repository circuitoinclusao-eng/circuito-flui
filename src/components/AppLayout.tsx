import { Link, useRouterState, useNavigate, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, FolderKanban, CalendarRange, HeartHandshake,
  Users, Contact, BarChart3, Settings, LogOut, Search, Plus, Menu, X, MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const NAV = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/editais", label: "Editais", icon: FileText },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/atividades", label: "Atividades", icon: CalendarRange },
  { to: "/atendimentos", label: "Atendimentos", icon: HeartHandshake },
  { to: "/grupos", label: "Grupos / Turmas", icon: Users },
  { to: "/contatos", label: "Contatos", icon: Contact },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { profile, signOut, roles } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const isActive = (to: string) => to === "/" ? path === "/" : path.startsWith(to);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          fixed md:sticky top-0 left-0 h-screen w-64 bg-sidebar text-sidebar-foreground
          flex flex-col z-40 transition-transform shadow-xl md:shadow-none`}
      >
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold">
              CI
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-sm">Circuito Inclusão</div>
              <div className="text-xs opacity-70">Gestor</div>
            </div>
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors
                ${isActive(to)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-4 border-sidebar-primary font-medium"
                  : "border-l-4 border-transparent hover:bg-sidebar-accent/60"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border text-xs opacity-70">
          v1.0 — MVP
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-card border-b border-border h-14 flex items-center gap-3 px-4 md:px-6">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9 h-9 bg-muted/50" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => nav({ to: "/projetos/novo" })}>Projeto</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ to: "/atividades/novo" })}>Atividade</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ to: "/atendimentos/novo" })}>Atendimento</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ to: "/editais/novo" })}>Edital</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ to: "/grupos/novo" })}>Grupo / Turma</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ to: "/contatos/novo" })}>Contato</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-full bg-primary-soft text-primary font-semibold flex items-center justify-center">
                {(profile?.nome ?? "U").substring(0, 1).toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-sm font-medium">{profile?.nome ?? "Usuário"}</div>
                <div className="text-xs text-muted-foreground">{profile?.email}</div>
                <div className="text-xs text-primary mt-1 capitalize">{roles[0] ?? "—"}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setOpen(false)} />
      )}

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border h-16 flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {[
          { to: "/", label: "Início", icon: LayoutDashboard },
          { to: "/projetos", label: "Projetos", icon: FolderKanban },
          { to: "/atividades", label: "Atividades", icon: CalendarRange },
          { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] ${
              isActive(to) ? "text-primary font-medium" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground"
        >
          <MoreHorizontal className="w-5 h-5" />
          Mais
        </button>
      </nav>
    </div>
  );
}

export function PageHeader({
  breadcrumb, title, actions,
}: { breadcrumb?: string[]; title: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6">
      {breadcrumb && (
        <nav className="text-xs text-muted-foreground mb-2">
          {breadcrumb.join("  ›  ")}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
