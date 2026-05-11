import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCSV, statusEncontroLabel } from "@/lib/atividades";
import { Printer, FileDown, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/atividades/$id/relatorio")({
  component: RelatorioAtividade,
});

function RelatorioAtividade() {
  const { id } = Route.useParams();
  const [ativ, setAtiv] = useState<any>(null);
  const [projeto, setProjeto] = useState<any>(null);
  const [encontros, setEncontros] = useState<any[]>([]);
  const [presencas, setPresencas] = useState<any[]>([]);
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [fotos, setFotos] = useState<any[]>([]);
  const [periodoIni, setPeriodoIni] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");

  useEffect(() => {
    (async () => {
      const { data: a } = await supabase.from("atividades").select("*").eq("id", id).maybeSingle();
      setAtiv(a);
      if (a?.projeto_id) {
        const { data: p } = await supabase.from("projetos").select("*").eq("id", a.projeto_id).maybeSingle();
        setProjeto(p);
      }
      const [{ data: enc }, { data: ins }, { data: fot }] = await Promise.all([
        supabase.from("encontros_atividade").select("*").eq("atividade_id", id).order("data"),
        supabase.from("atividade_inscritos").select("atendido_id, status, data_inscricao, atendidos(id,nome,telefone,cidade,data_nascimento)").eq("atividade_id", id),
        supabase.from("atividade_fotos").select("*").eq("atividade_id", id).order("data_foto", { ascending: false }).limit(12),
      ]);
      setEncontros(enc ?? []);
      setInscritos(ins ?? []);
      setFotos(fot ?? []);
      const encIds = (enc ?? []).map((e) => e.id);
      if (encIds.length) {
        const { data: pr } = await supabase
          .from("presencas_atividade")
          .select("encontro_id, atendido_id, status, presente, observacao")
          .in("encontro_id", encIds);
        setPresencas(pr ?? []);
      }
    })();
  }, [id]);

  if (!ativ) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  const encFiltrados = encontros.filter((e) => {
    if (periodoIni && e.data < periodoIni) return false;
    if (periodoFim && e.data > periodoFim) return false;
    return true;
  });
  const idsEncFiltrados = new Set(encFiltrados.map((e) => e.id));
  const presFiltradas = presencas.filter((p) => idsEncFiltrados.has(p.encontro_id));

  const realizados = encFiltrados.filter((e) => e.status === "realizada");
  const totalEncontros = encFiltrados.length;
  const totalRealizados = realizados.length;
  const totalInscritos = inscritos.filter((i) => i.status === "inscrito").length;

  // por participante
  const porAtendido = new Map<string, { nome: string; presentes: number; faltas: number; justificadas: number; total: number }>();
  inscritos.forEach((i) => {
    porAtendido.set(i.atendido_id, { nome: i.atendidos?.nome ?? "?", presentes: 0, faltas: 0, justificadas: 0, total: 0 });
  });
  presFiltradas.forEach((p) => {
    if (!porAtendido.has(p.atendido_id)) {
      porAtendido.set(p.atendido_id, { nome: "?", presentes: 0, faltas: 0, justificadas: 0, total: 0 });
    }
    const o = porAtendido.get(p.atendido_id)!;
    o.total++;
    const st = p.status ?? (p.presente ? "presente" : "falta");
    if (st === "presente") o.presentes++;
    else if (st === "justificada") o.justificadas++;
    else o.faltas++;
  });

  const arrayAt = Array.from(porAtendido.entries()).map(([id, v]) => ({
    id, ...v,
    taxa: v.total ? (v.presentes / v.total) * 100 : 0,
  }));
  const maisFrequentes = [...arrayAt].sort((a, b) => b.presentes - a.presentes).slice(0, 5);
  const faltasRecorrentes = [...arrayAt].filter((a) => a.faltas >= 3).sort((a, b) => b.faltas - a.faltas).slice(0, 10);

  const totalP = presFiltradas.filter((p) => (p.status ?? (p.presente ? "presente" : "falta")) === "presente").length;
  const mediaPresenca = presFiltradas.length ? (totalP / presFiltradas.length) * 100 : 0;

  const observacoes = realizados.map((e) => ({ data: e.data, resumo: e.resumo, observacoes: e.observacoes }))
    .filter((x) => x.resumo || x.observacoes);

  function exportCSV() {
    const rows: (string | number | null)[][] = [
      ["RELATÓRIO DA ATIVIDADE"],
      ["Atividade", ativ.titulo],
      ["Projeto", projeto?.titulo ?? "—"],
      ["Cidade", projeto?.cidade ?? "—"],
      ["Período", `${periodoIni || "início"} a ${periodoFim || "hoje"}`],
      [],
      ["Indicador", "Valor"],
      ["Encontros previstos", totalEncontros],
      ["Encontros realizados", totalRealizados],
      ["Inscritos ativos", totalInscritos],
      ["Média de presença", `${mediaPresenca.toFixed(1)}%`],
      [],
      ["Participante", "Presenças", "Faltas", "Justificadas", "% Presença"],
    ];
    arrayAt.forEach((a) => {
      rows.push([a.nome, a.presentes, a.faltas, a.justificadas, `${a.taxa.toFixed(1)}%`]);
    });
    rows.push([], ["Data", "Status", "Resumo", "Observações"]);
    encFiltrados.forEach((e) => {
      rows.push([
        new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR"),
        statusEncontroLabel(e.status),
        e.resumo ?? "",
        e.observacoes ?? "",
      ]);
    });
    downloadCSV(`relatorio-${ativ.titulo}.csv`, rows);
  }

  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2 print:hidden">
        Início › <Link to="/atividades" className="hover:underline">Atividades</Link> ›{" "}
        <Link to="/atividades/$id" params={{ id }} className="hover:underline">{ativ.titulo}</Link> › Relatório
      </nav>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Relatório da atividade</h1>
          <p className="text-sm text-muted-foreground">{ativ.titulo}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild size="sm">
            <Link to="/atividades/$id" params={{ id }}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><FileDown className="w-4 h-4 mr-1" /> Exportar CSV</Button>
          <Button size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Imprimir / PDF</Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
        <div>
          <label className="text-xs uppercase text-muted-foreground">Período inicial</label>
          <Input type="date" value={periodoIni} onChange={(e) => setPeriodoIni(e.target.value)} />
        </div>
        <div>
          <label className="text-xs uppercase text-muted-foreground">Período final</label>
          <Input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
        </div>
      </div>

      {/* Conteúdo imprimível */}
      <div className="space-y-6">
        <header className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold">Relatório da atividade</h1>
          <p className="text-sm">{ativ.titulo}</p>
        </header>

        <section className="bg-card border rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-3">Identificação</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Item label="Atividade" value={ativ.titulo} />
            <Item label="Modalidade" value={ativ.tipo ?? "—"} />
            <Item label="Projeto" value={projeto?.titulo ?? "—"} />
            <Item label="Cidade / Polo" value={projeto?.cidade ?? "—"} />
            <Item label="Local" value={ativ.local ?? "—"} />
            <Item label="Status" value={ativ.status} />
            <Item label="Período da atividade" value={`${ativ.data_inicio ?? "?"} → ${ativ.data_fim ?? "?"}`} />
            <Item label="Período analisado" value={`${periodoIni || "início"} → ${periodoFim || "hoje"}`} />
          </dl>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Encontros previstos" value={totalEncontros} />
          <Kpi label="Encontros realizados" value={totalRealizados} />
          <Kpi label="Inscritos ativos" value={totalInscritos} />
          <Kpi label="Média de presença" value={`${mediaPresenca.toFixed(1)}%`} />
        </section>

        <section className="bg-card border rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-3">Participantes mais frequentes</h2>
          {maisFrequentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados de presença ainda.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th className="py-2">Nome</th><th>Presenças</th><th>Faltas</th><th>% Presença</th></tr></thead>
              <tbody>
                {maisFrequentes.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2">{a.nome}</td>
                    <td className="text-success font-medium">{a.presentes}</td>
                    <td>{a.faltas}</td>
                    <td>{a.taxa.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {faltasRecorrentes.length > 0 && (
          <section className="bg-card border rounded-xl shadow-sm p-5">
            <h2 className="font-semibold mb-3 text-destructive">Faltas recorrentes (3+ faltas)</h2>
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th className="py-2">Nome</th><th>Faltas</th><th>Justificadas</th><th>% Presença</th></tr></thead>
              <tbody>
                {faltasRecorrentes.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2">{a.nome}</td>
                    <td className="text-destructive font-medium">{a.faltas}</td>
                    <td>{a.justificadas}</td>
                    <td>{a.taxa.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {observacoes.length > 0 && (
          <section className="bg-card border rounded-xl shadow-sm p-5">
            <h2 className="font-semibold mb-3">Observações do professor</h2>
            <ul className="space-y-3 text-sm">
              {observacoes.map((o, i) => (
                <li key={i} className="border-l-2 border-primary/40 pl-3">
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  </div>
                  {o.resumo && <p className="mt-1 whitespace-pre-wrap">{o.resumo}</p>}
                  {o.observacoes && <p className="mt-1 text-muted-foreground italic whitespace-pre-wrap">{o.observacoes}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {(ativ.resultado_esperado || ativ.objetivo_relacionado) && (
          <section className="bg-card border rounded-xl shadow-sm p-5">
            <h2 className="font-semibold mb-3">Resultados e objetivos</h2>
            {ativ.objetivo_relacionado && <p className="text-sm mb-2"><strong>Objetivo:</strong> {ativ.objetivo_relacionado}</p>}
            {ativ.resultado_esperado && <p className="text-sm"><strong>Resultado esperado:</strong> {ativ.resultado_esperado}</p>}
          </section>
        )}

        {fotos.length > 0 && (
          <section className="bg-card border rounded-xl shadow-sm p-5">
            <h2 className="font-semibold mb-3">Evidências (fotos)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {fotos.map((f) => (
                <img key={f.id} src={f.url} alt={f.legenda ?? ""} className="w-full aspect-square object-cover rounded" />
              ))}
            </div>
          </section>
        )}

        <section className="bg-card border rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-3">Histórico de encontros ({encFiltrados.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th className="py-2">Data</th><th>Status</th><th>Presentes</th><th>Resumo</th></tr></thead>
              <tbody>
                {encFiltrados.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 align-top">
                    <td className="py-2 whitespace-nowrap">{new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                    <td>{statusEncontroLabel(e.status)}</td>
                    <td>{e.numero_presentes ?? 0}</td>
                    <td className="text-muted-foreground">{e.resumo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-card border rounded-xl shadow-sm p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
function Item({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
