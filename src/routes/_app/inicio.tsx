import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/AppLayout";
import { StatCard, SectionCard, StatusBadge } from "@/components/Cards";
import {
  FolderKanban, Users, CalendarRange, ClipboardCheck,
  AlertCircle, FileWarning, Clock, Cake, MapPin,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_app/inicio")({
  component: Dashboard,
});

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfWeek(d = new Date()) {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 7);
  return x;
}
function iso(d: Date) { return d.toISOString().slice(0, 10); }

function Dashboard() {
  const { user, hasRole, isAdminOrCoord } = useAuth();
  const isProfessorOnly = hasRole("professor") && !isAdminOrCoord;
  const hoje = new Date();
  const semIni = iso(startOfWeek(hoje));
  const semFim = iso(endOfWeek(hoje));
  const mesAtual = hoje.getMonth() + 1;
  const em30 = new Date(); em30.setDate(em30.getDate() + 30);

  const [stats, setStats] = useState({
    atividadesSemana: 0,
    chamadasPendentes: 0,
    pessoasAtendidas: 0,
    projetosAtivos: 0,
  });
  const [encontrosSemana, setEncontrosSemana] = useState<any[]>([]);
  const [chamadasPend, setChamadasPend] = useState<any[]>([]);
  const [docsPend, setDocsPend] = useState<any[]>([]);
  const [topFaltosos, setTopFaltosos] = useState<any[]>([]);
  const [projFim, setProjFim] = useState<any[]>([]);
  const [aniversariantes, setAniversariantes] = useState<any[]>([]);
  const [presencaMes, setPresencaMes] = useState<any[]>([]);
  const [porCidade, setPorCidade] = useState<any[]>([]);
  const [porModalidade, setPorModalidade] = useState<any[]>([]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  async function load() {
    let atividadeIds: string[] | null = null;
    let atendidoIds: string[] | null = null;
    let projetoIds: string[] | null = null;
    if (isProfessorOnly && user?.id) {
      const { data: vinc } = await supabase
        .from("atividade_educadores").select("atividade_id").eq("usuario_id", user.id);
      atividadeIds = (vinc ?? []).map((x: any) => x.atividade_id);
      if (atividadeIds.length === 0) atividadeIds = ["00000000-0000-0000-0000-000000000000"];

      const [{ data: ats }, { data: insc }] = await Promise.all([
        supabase.from("atividades").select("projeto_id").in("id", atividadeIds),
        supabase.from("atividade_inscritos").select("atendido_id").in("atividade_id", atividadeIds),
      ]);
      projetoIds = Array.from(new Set((ats ?? []).map((a: any) => a.projeto_id).filter(Boolean)));
      atendidoIds = Array.from(new Set((insc ?? []).map((i: any) => i.atendido_id)));
      if (atendidoIds.length === 0) atendidoIds = ["00000000-0000-0000-0000-000000000000"];
    }

    const qSemana = supabase.from("encontros_atividade")
      .select("id,data,horario_inicio,status,atividade_id,atividades(titulo,tipo,local)")
      .gte("data", semIni).lt("data", semFim).order("data");
    if (atividadeIds) qSemana.in("atividade_id", atividadeIds);

    const qPend = supabase.from("encontros_atividade")
      .select("id,data,atividade_id,atividades(titulo)")
      .eq("status", "nao_registrada").lt("data", iso(hoje)).order("data", { ascending: false }).limit(8);
    if (atividadeIds) qPend.in("atividade_id", atividadeIds);

    const qPessoasAtendidas = supabase.from("atendidos").select("*", { count: "exact", head: true });
    if (atendidoIds) qPessoasAtendidas.in("id", atendidoIds);

    const qProjAtivos = supabase.from("projetos").select("*", { count: "exact", head: true })
      .in("status", ["em_execucao", "aprovado"]);
    if (projetoIds) projetoIds.length ? qProjAtivos.in("id", projetoIds) : qProjAtivos.eq("id", "00000000-0000-0000-0000-000000000000");

    const qDocs = supabase.from("projetos")
      .select("id,titulo,data_fim,situacao_prestacao_contas")
      .in("situacao_prestacao_contas", ["em_elaboracao", "com_pendencia"]).limit(5);
    if (projetoIds) projetoIds.length ? qDocs.in("id", projetoIds) : qDocs.eq("id", "00000000-0000-0000-0000-000000000000");

    const qProjFim = supabase.from("projetos")
      .select("id,titulo,data_fim,status")
      .in("status", ["em_execucao", "aprovado"])
      .gte("data_fim", iso(hoje)).lte("data_fim", iso(em30)).order("data_fim").limit(6);
    if (projetoIds) projetoIds.length ? qProjFim.in("id", projetoIds) : qProjFim.eq("id", "00000000-0000-0000-0000-000000000000");

    const qAniv = supabase.from("atendidos").select("id,nome,data_nascimento").not("data_nascimento", "is", null);
    if (atendidoIds) qAniv.in("id", atendidoIds);

    const qFaltas = supabase.from("presencas_atividade")
      .select("atendido_id,presente,atendidos(nome),encontro_id,encontros_atividade!inner(atividade_id)")
      .eq("presente", false).limit(2000);
    if (atividadeIds) qFaltas.in("encontros_atividade.atividade_id", atividadeIds);

    const qCidade = supabase.from("atendidos").select("cidade").eq("status", "ativo");
    if (atendidoIds) qCidade.in("id", atendidoIds);

    const qMod = supabase.from("atividades").select("tipo");
    if (atividadeIds) qMod.in("id", atividadeIds);

    const qPresMes = supabase.from("encontros_atividade")
      .select("data,numero_presentes")
      .gte("data", iso(new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1)));
    if (atividadeIds) qPresMes.in("atividade_id", atividadeIds);

    const [
      semana, pend, pessoasAtendidas, projAtivos, docs, projFinal, aniv, faltasRows, cidadeRows, modRows, presMes,
    ] = await Promise.all([
      qSemana, qPend, qPessoasAtendidas, qProjAtivos, qDocs, qProjFim, qAniv, qFaltas, qCidade, qMod, qPresMes,
    ]);

    setEncontrosSemana(semana.data ?? []);
    setChamadasPend(pend.data ?? []);
    setDocsPend(docs.data ?? []);
    setProjFim(projFinal.data ?? []);

    setStats({
      atividadesSemana: (semana.data ?? []).length,
      chamadasPendentes: (pend.data ?? []).length,
      pessoasAtendidas: pessoasAtendidas.count ?? 0,
      projetosAtivos: projAtivos.count ?? 0,
    });

    const ans = (aniv.data ?? []).filter((p: any) => {
      const d = new Date(p.data_nascimento);
      return d.getMonth() + 1 === mesAtual;
    }).sort((a: any, b: any) => new Date(a.data_nascimento).getDate() - new Date(b.data_nascimento).getDate());
    setAniversariantes(ans.slice(0, 10));

    const counts: Record<string, { nome: string; n: number }> = {};
    (faltasRows.data ?? []).forEach((r: any) => {
      const id = r.atendido_id;
      if (!counts[id]) counts[id] = { nome: r.atendidos?.nome ?? "—", n: 0 };
      counts[id].n++;
    });
    setTopFaltosos(Object.entries(counts).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.n - a.n).slice(0, 6));

    const cMap: Record<string, number> = {};
    (cidadeRows.data ?? []).forEach((r: any) => {
      const c = r.cidade || "Não informado";
      cMap[c] = (cMap[c] ?? 0) + 1;
    });
    setPorCidade(Object.entries(cMap).map(([cidade, total]) => ({ cidade, total })).sort((a, b) => b.total - a.total).slice(0, 6));

    const mMap: Record<string, number> = {};
    (modRows.data ?? []).forEach((r: any) => {
      const t = r.tipo || "Não informado";
      mMap[t] = (mMap[t] ?? 0) + 1;
    });
    setPorModalidade(Object.entries(mMap).map(([modalidade, total]) => ({ modalidade, total })).sort((a, b) => b.total - a.total).slice(0, 8));

    const pm: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      pm[d.toLocaleDateString("pt-BR", { month: "short" })] = 0;
    }
    (presMes.data ?? []).forEach((r: any) => {
      if (!r.data) return;
      const d = new Date(r.data);
      const k = d.toLocaleDateString("pt-BR", { month: "short" });
      if (k in pm) pm[k] += r.numero_presentes ?? 0;
    });
    setPresencaMes(Object.entries(pm).map(([mes, presencas]) => ({ mes, presencas })));
  }

  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <>
      <PageHeader breadcrumb={["Início"]} title={isProfessorOnly ? "Minhas turmas" : "Painel geral"} />
      {isProfessorOnly && (
        <p className="text-sm text-muted-foreground -mt-2 mb-4">Mostrando apenas as atividades em que você é educador.</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Atividades da semana" value={stats.atividadesSemana} icon={CalendarRange} to="/atividades" variant="blue" />
        <StatCard label="Chamadas pendentes" value={stats.chamadasPendentes} icon={ClipboardCheck} variant="amber" />
        <StatCard label="Pessoas atendidas" value={stats.pessoasAtendidas} icon={Users} to="/atendidos" variant="lilac" />
        <StatCard label="Projetos ativos" value={stats.projetosAtivos} icon={FolderKanban} to="/projetos" variant="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <SectionCard title="Atividades desta semana">
            {encontrosSemana.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade marcada para esta semana.</p>
            ) : (
              <ul className="divide-y">
                {encontrosSemana.map((e) => {
                  const d = new Date(e.data);
                  return (
                    <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-muted rounded-lg w-12 text-center py-1 shrink-0">
                          <div className="text-[10px] uppercase text-muted-foreground">{dias[d.getDay()]}</div>
                          <div className="font-bold">{d.getDate()}</div>
                        </div>
                        <div className="min-w-0">
                          <Link to="/atividades/$id" params={{ id: e.atividade_id }} className="font-medium hover:text-primary truncate block">
                            {e.atividades?.titulo}
                          </Link>
                          <div className="text-xs text-muted-foreground truncate">
                            {e.atividades?.tipo ?? "—"} • {e.atividades?.local ?? "Sem local"} {e.horario_inicio ? `• ${e.horario_inicio.slice(0, 5)}` : ""}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={e.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Presença mensal (últimos 6 meses)">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={presencaMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.015 255)" />
                  <XAxis dataKey="mes" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="presencas" fill="oklch(0.5 0.18 255)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <SectionCard title="Participantes por cidade / polo">
              {porCidade.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
                <ul className="space-y-2">
                  {porCidade.map((c) => (
                    <li key={c.cidade} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{c.cidade}</span>
                      <span className="font-semibold">{c.total}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
            <SectionCard title="Atividades por modalidade">
              {porModalidade.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
                <ul className="space-y-2">
                  {porModalidade.map((m) => (
                    <li key={m.modalidade} className="flex items-center justify-between text-sm">
                      <span>{m.modalidade}</span>
                      <span className="font-semibold">{m.total}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <SectionCard title="Chamadas pendentes" action={<AlertCircle className="w-4 h-4 text-warning" />}>
            {chamadasPend.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma chamada pendente. ✔</p>
            ) : (
              <ul className="space-y-2">
                {chamadasPend.map((e) => (
                  <li key={e.id} className="text-sm">
                    <Link to="/atividades/$id" params={{ id: e.atividade_id }} className="font-medium hover:text-primary block truncate">
                      {e.atividades?.titulo}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.data).toLocaleDateString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Projetos próximos do fim" action={<Clock className="w-4 h-4 text-warning" />}>
            {projFim.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto encerrando em 30 dias.</p>
            ) : (
              <ul className="space-y-2">
                {projFim.map((p) => (
                  <li key={p.id} className="text-sm">
                    <Link to="/projetos/$id" params={{ id: p.id }} className="font-medium hover:text-primary block truncate">
                      {p.titulo}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      Encerra em {new Date(p.data_fim).toLocaleDateString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Documentos / prestação pendente" action={<FileWarning className="w-4 h-4 text-warning" />}>
            {docsPend.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem pendências de prestação.</p>
            ) : (
              <ul className="space-y-2">
                {docsPend.map((p) => (
                  <li key={p.id} className="text-sm">
                    <Link to="/projetos/$id" params={{ id: p.id }} className="font-medium hover:text-primary block truncate">
                      {p.titulo}
                    </Link>
                    <span className="text-xs text-muted-foreground capitalize">
                      {p.situacao_prestacao_contas?.replaceAll("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Participantes com mais faltas">
            {topFaltosos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem registros de falta.</p>
            ) : (
              <ul className="space-y-2">
                {topFaltosos.map((f) => (
                  <li key={f.id} className="flex items-center justify-between text-sm">
                    <Link to="/atendidos/$id" params={{ id: f.id }} className="hover:text-primary truncate">
                      {f.nome}
                    </Link>
                    <span className="font-semibold text-destructive">{f.n}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Aniversariantes do mês" action={<Cake className="w-4 h-4 text-primary" />}>
            {aniversariantes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum aniversariante este mês.</p>
            ) : (
              <ul className="space-y-2">
                {aniversariantes.map((a) => {
                  const d = new Date(a.data_nascimento);
                  return (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <Link to="/atendidos/$id" params={{ id: a.id }} className="hover:text-primary truncate">
                        {a.nome}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {String(d.getDate()).padStart(2, "0")}/{String(d.getMonth() + 1).padStart(2, "0")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
