import { Link } from "@tanstack/react-router";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  to?: string;
  variant?: "blue" | "lilac" | "amber" | "teal";
}

const variants = {
  blue: "stat-card",
  lilac: "stat-card-lilac",
  amber: "stat-card-amber",
  teal: "stat-card-teal",
};

export function StatCard({ label, value, icon: Icon, to, variant = "blue" }: StatCardProps) {
  const inner = (
    <div className={`${variants[variant]} rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl md:text-4xl font-bold leading-none">{value}</div>
          <div className="text-xs md:text-sm mt-2 opacity-90 font-medium">{label}</div>
        </div>
        <Icon className="w-8 h-8 opacity-80" />
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export function SectionCard({
  title, action, children,
}: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-card border rounded-xl shadow-sm">
      <header className="px-5 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm md:text-base">{title}</h2>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    aberto: "bg-info/15 text-info",
    em_execucao: "bg-primary/15 text-primary",
    "em execução": "bg-primary/15 text-primary",
    aprovado: "bg-success/15 text-success",
    finalizado: "bg-muted text-muted-foreground",
    fechado: "bg-success/15 text-success",
    pendente: "bg-warning/20 text-warning-foreground",
    rascunho: "bg-muted text-muted-foreground",
    em_analise: "bg-secondary text-secondary-foreground",
    "em análise": "bg-secondary text-secondary-foreground",
    enviado: "bg-info/15 text-info",
    reprovado: "bg-destructive/15 text-destructive",
    encerrado: "bg-muted text-muted-foreground",
    resolvido: "bg-success/15 text-success",
    acompanhamento: "bg-warning/20 text-warning-foreground",
    planejada: "bg-muted text-muted-foreground",
    realizada: "bg-success/15 text-success",
    cancelada: "bg-destructive/15 text-destructive",
  };
  const cls = map[status?.toLowerCase()] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status?.replace("_", " ") ?? "—"}
    </span>
  );
}
