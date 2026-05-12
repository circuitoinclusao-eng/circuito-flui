import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Compass, Upload, BarChart3, ServerCog } from "lucide-react";

export const Route = createFileRoute("/_app/bussola")({
  component: BussolaLayout,
});

const TABS = [
  { to: "/bussola", label: "Painel", icon: Compass, exact: true },
  { to: "/bussola/importar", label: "Importação", icon: Upload },
  { to: "/bussola/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/bussola/admin", label: "Administração", icon: ServerCog },
];

function BussolaLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div>
      <div className="mb-4">
        <nav className="text-xs text-muted-foreground mb-2">Início › Bússola PCD</nav>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Bússola — Atendimentos PCD
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consolide planilhas do sistema Bússola e visualize indicadores de pessoas com deficiência atendidas, segmentadas por grau.
        </p>
      </div>
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {TABS.map((t) => {
          const active = t.exact ? path === t.to : path.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors ${
                active
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
