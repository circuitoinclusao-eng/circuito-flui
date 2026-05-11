import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppLayout";
import { StatCard, SectionCard, StatusBadge } from "@/components/Cards";
import {
  FolderKanban, Users, CalendarRange, FileText, HeartHandshake,
  AlertCircle, TrendingUp, ListChecks,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/_app/inicio")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({
    projetos: 0, atendidos: 0, atividades: 0, grupos: 0,
    editaisAbertos: 0, atendMes: 0, pendentes: 0, emExecucao: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [editais, setEditais] = useState<any[]>([]);
  const [chartMes, setChartMes] = useState<any[]>([]);
  const [chartStatus, setChartStatus] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const now = new Date();
    const mesIni = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      proj, ativ, grup, ed, atendMes, pend, emEx, atividadesAll, projetosStatus, recentAt, edAbertos,
    ] = await Promise.all([
      supabase.from("projetos").select("*", { count: "exact", head: true }),
      supabase.from("atividades").select("participantes_atendidos"),
      supabase.from("grupos").select("*", { count: "exact", head: true }),
      supabase.from("editais").select("*", { count: "exact", head: true }).eq("status", "aberto"),
      supabase.from("atendimentos").select("*", { count: "exact", head: true }).gte("data", mesIni.slice(0, 10)),
      supabase.from("fechamentos_mensais").select("*", { count: "exact", head: true }).eq("situacao", "aberto"),
      supabase.from("projetos").select("*", { count: "exact", head: true }).eq("status", "em_execucao"),
      supabase.from("atividades").select("data"),
      supabase.from("projetos").select("status"),
      supabase.from("atividades").select("id,titulo,data,status,projetos(titulo)").order("created_at", { ascending: false }).limit(5),
      supabase.from("editais").select("id,titulo,data_fim,status").eq("status", "aberto").order("data_fim").limit(5),
    ]);

    const totalAtendidos = (ativ.data ?? []).reduce((s: number, r: any) => s + (r.participantes_atendidos ?? 0), 0);

    setStats({
      projetos: proj.count ?? 0,
      atendidos: totalAtendidos,
      atividades: ativ.data?.length ?? 0,
      grupos: grup.count ?? 0,
      editaisAbertos: ed.count ?? 0,
      atendMes: atendMes.count ?? 0,
      pendentes: pend.count ?? 0,
      emExecucao: emEx.count ?? 0,
    });

    // chart por mês (últimos 6)
    const counts: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = d.toLocaleDateString("pt-BR", { month: "short" });
      counts[k] = 0;
    }
    (atividadesAll.data ?? []).forEach((a: any) => {
      if (!a.data) return;
      const d = new Date(a.data);
      const k = d.toLocaleDateString("pt-BR", { month: "short" });
      if (k in counts) counts[k]++;
    });
    setChartMes(Object.entries(counts).map(([mes, total]) => ({ mes, total })));

    const sc: Record<string, number> = {};
    (projetosStatus.data ?? []).forEach((p: any) => { sc[p.status] = (sc[p.status] ?? 0) + 1; });
    setChartStatus(Object.entries(sc).map(([name, value]) => ({ name, value })));

    setRecent(recentAt.data ?? []);
    setEditais(edAbertos.data ?? []);
  }

  const COLORS = ["oklch(0.5 0.18 255)", "oklch(0.55 0.16 295)", "oklch(0.72 0.16 75)", "oklch(0.62 0.13 200)", "oklch(0.65 0.16 155)", "oklch(0.6 0.22 27)"];

  return (
    <>
      <PageHeader breadcrumb={["Início"]} title="Painel geral" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Projetos" value={stats.projetos} icon={FolderKanban} to="/projetos" variant="blue" />
        <StatCard label="Pessoas atendidas" value={stats.atendidos} icon={Users} variant="lilac" />
        <StatCard label="Atividades" value={stats.atividades} icon={CalendarRange} to="/atividades" variant="teal" />
        <StatCard label="Grupos / turmas" value={stats.grupos} icon={Users} to="/grupos" variant="amber" />
        <StatCard label="Editais abertos" value={stats.editaisAbertos} icon={FileText} to="/editais" variant="blue" />
        <StatCard label="Atendimentos do mês" value={stats.atendMes} icon={HeartHandshake} to="/atendimentos" variant="teal" />
        <StatCard label="Pendentes de fechamento" value={stats.pendentes} icon={AlertCircle} variant="amber" />
        <StatCard label="Projetos em execução" value={stats.emExecucao} icon={TrendingUp} variant="lilac" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <SectionCard title="Atividades por mês">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.015 255)" />
                  <XAxis dataKey="mes" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="oklch(0.5 0.18 255)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Atividades recentes" action={<Link to="/atividades" className="text-xs text-primary hover:underline">Ver todas</Link>}>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade ainda. <Link to="/atividades/novo" className="text-primary hover:underline">Cadastrar uma</Link>.</p>
            ) : (
              <ul className="divide-y">
                {recent.map((a) => (
                  <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link to="/atividades/$id" params={{ id: a.id }} className="font-medium hover:text-primary truncate block">
                        {a.titulo}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {a.projetos?.titulo ?? "Sem projeto"} • {a.data ? new Date(a.data).toLocaleDateString("pt-BR") : "Sem data"}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4 md:space-y-6">
          <SectionCard title="Projetos por status">
            <div className="h-56">
              {chartStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e: any) => e.name}>
                      {chartStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Editais abertos" action={<Link to="/editais" className="text-xs text-primary hover:underline">Ver todos</Link>}>
            {editais.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum edital aberto.</p>
            ) : (
              <ul className="space-y-3">
                {editais.map((e) => (
                  <li key={e.id} className="text-sm">
                    <div className="font-medium">{e.titulo}</div>
                    <div className="text-xs text-muted-foreground">
                      Encerra em: {e.data_fim ? new Date(e.data_fim).toLocaleDateString("pt-BR") : "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Pendências do mês">
            <div className="flex items-center gap-3">
              <ListChecks className="w-8 h-8 text-warning" />
              <div>
                <div className="text-2xl font-bold">{stats.pendentes}</div>
                <div className="text-xs text-muted-foreground">Fechamentos abertos</div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
