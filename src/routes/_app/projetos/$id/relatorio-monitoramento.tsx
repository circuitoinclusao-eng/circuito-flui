import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { calcularIdade } from "@/lib/atividades";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const search = z.object({
  inicio: z.string(),
  fim: z.string(),
  atividades: z.coerce.number().default(1),
  atendidos: z.coerce.number().default(1),
  frequencia: z.coerce.number().default(1),
  fotos: z.coerce.number().default(1),
  metas: z.coerce.number().default(1),
  pendencias: z.coerce.number().default(1),
  resumo: z.string().optional().default(""),
});

export const Route = createFileRoute("/_app/projetos/$id/relatorio-monitoramento")({
  validateSearch: (s) => search.parse(s),
  component: RelatorioMonitoramento,
});

function RelatorioMonitoramento() {
  const { id } = Route.useParams();
  const opts = Route.useSearch();
  const [data, setData] = useState<any>(null);
  const savedHistory = useRef(false);

  useEffect(() => {
    (async () => {
      const { data: projeto } = await supabase.from("projetos").select("*").eq("id", id).maybeSingle();
      const { data: atividades } = await supabase.from("atividades").select("*").eq("projeto_id", id).order("data_inicio", { ascending: true });
      const atividadeIds = (atividades ?? []).map((a: any) => a.id);
      const [{ data: metas }, { data: fotosProjeto }] = await Promise.all([
        supabase.from("projeto_metas").select("*").eq("projeto_id", id).order("created_at"),
        supabase.from("projeto_fotos").select("*").eq("projeto_id", id).gte("data_foto", opts.inicio).lte("data_foto", opts.fim).order("data_foto"),
      ]);
      let encontros: any[] = [], inscritos: any[] = [], presencas: any[] = [], fotosAtividades: any[] = [], educadores: any[] = [];
      if (atividadeIds.length) {
        const [enc, ins, pre, fot, edu] = await Promise.all([
          supabase.from("encontros_atividade").select("*").in("atividade_id", atividadeIds).gte("data", opts.inicio).lte("data", opts.fim).order("data"),
          supabase.from("atividade_inscritos").select("atividade_id,status,atendidos(id,nome,genero,data_nascimento,cidade)").in("atividade_id", atividadeIds),
          supabase.from("presencas_atividade").select("atividade_id,encontro_id,atendido_id,status").in("atividade_id", atividadeIds),
          supabase.from("atividade_fotos").select("atividade_id,url,legenda,data_foto,ordem").in("atividade_id", atividadeIds).gte("data_foto", opts.inicio).lte("data_foto", opts.fim).order("ordem"),
          supabase.from("atividade_educadores").select("atividade_id, profiles:usuario_id(nome)").in("atividade_id", atividadeIds),
        ]);
        encontros = enc.data ?? []; inscritos = ins.data ?? []; presencas = pre.data ?? []; fotosAtividades = fot.data ?? []; educadores = edu.data ?? [];
      }
      const atividadesPorId = new Map((atividades ?? []).map((a: any) => [a.id, a]));
      const atendidosMap = new Map<string, any>();
      inscritos.forEach((i: any) => { if (i.atendidos?.id) atendidosMap.set(i.atendidos.id, i.atendidos); });
      const encontrosRealizados = encontros.filter((e: any) => e.status === "realizada");
      const presencasValidas = presencas.filter((p: any) => p.status === "presente" || p.status === "falta");
      const presencasPresentes = presencas.filter((p: any) => p.status === "presente");
      const frequenciaMedia = presencasValidas.length ? Math.round((presencasPresentes.length / presencasValidas.length) * 100) : 0;
      const metasCumpridas = (metas ?? []).filter((m: any) => Number(m.quantidade_realizada ?? 0) >= Number(m.quantidade_prevista ?? 0)).length;
      const pendencias = buildPendencias(atividades ?? [], encontros, fotosAtividades, metas ?? [], [...atendidosMap.values()]);
      const cidades = [...new Set([...atendidosMap.values()].map((a: any) => a.cidade).filter(Boolean))];
      const resumo = opts.resumo || `No período selecionado, o projeto ${projeto?.titulo ?? ""} realizou ${(atividades ?? []).length} atividades, alcançou ${atendidosMap.size} atendidos e registrou ${encontros.length} encontros. A frequência média foi de ${frequenciaMedia}%. As ações foram desenvolvidas nos territórios ${cidades.join(", ") || projeto?.cidade || "cadastrados"}.`;
      setData({ projeto, atividades: atividades ?? [], metas: metas ?? [], fotos: [...(fotosProjeto ?? []), ...fotosAtividades], encontros, encontrosRealizados, inscritos, presencas, educadores, atividadesPorId, atendidos: [...atendidosMap.values()], frequenciaMedia, metasCumpridas, pendencias, resumo });
      document.title = `relatorio_monitoramento_${slug(projeto?.titulo ?? "projeto")}_${opts.inicio}_${opts.fim}`;
      if (!savedHistory.current) {
        savedHistory.current = true;
        const { data: auth } = await supabase.auth.getUser();
        await (supabase as any).from("relatorios_emitidos").insert({ tipo: "relatorio_monitoramento_projeto", entidade_tipo: "projeto", entidade_id: id, periodo_inicio: opts.inicio, periodo_fim: opts.fim, titulo: `Relatório de monitoramento - ${projeto?.titulo ?? ""}`, usuario_id: auth.user?.id ?? null, parametros_json: opts });
      }
    })();
  }, [id, opts]);

  if (!data) return <div className="p-8 text-muted-foreground">Carregando relatório...</div>;
  const { projeto, atividades, metas, fotos, encontros, encontrosRealizados, inscritos, presencas, educadores, atividadesPorId, atendidos, frequenciaMedia, metasCumpridas, pendencias, resumo } = data;
  const periodo = `${fmt(opts.inicio)} a ${fmt(opts.fim)}`;

  return <div className="bg-white text-black max-w-[210mm] mx-auto print:max-w-none print:mx-0">
    <style>{`@media print{@page{size:A4;margin:15mm 13mm 20mm}.no-print{display:none!important}.page-break{page-break-before:always}body{background:white}.report-footer{position:fixed;bottom:6mm;left:13mm;right:13mm;font-size:10px;color:#555;display:flex;justify-content:space-between}}.break-safe{break-inside:avoid;page-break-inside:avoid}`}</style>
    <div className="no-print sticky top-0 bg-card border-b px-4 py-2 flex items-center justify-between gap-2 z-10"><div className="text-sm text-muted-foreground">Pré-visualização do relatório de monitoramento — use o botão para imprimir ou salvar em PDF.</div><Button size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Imprimir / Salvar PDF</Button></div>
    <div className="report-footer"><span>Relatório de monitoramento de projeto</span><span>Página</span></div>
    <section className="p-8 min-h-[270mm]"><div className="text-sm font-bold text-blue-800 mb-8">Circuito Inclusão</div><h1 className="text-3xl font-bold mb-2">RELATÓRIO DE MONITORAMENTO DE PROJETO</h1><p className="text-lg text-gray-700 mb-8">Período: {periodo}</p><div className="grid grid-cols-2 gap-2 text-sm mb-6"><Info label="Projeto" value={projeto?.titulo} /><Info label="Número" value={projeto?.numero_projeto} /><Info label="Status" value={projeto?.status} /><Info label="Cidade/Território" value={[projeto?.cidade, projeto?.territorio].filter(Boolean).join(" / ")} /><Info label="Responsável" value={projeto?.responsavel_nome} /><Info label="Coordenador" value={projeto?.coordenador_nome} /><Info label="Patrocinador/Edital" value={projeto?.patrocinador} /><Info label="Fonte de recurso" value={projeto?.fonte_recurso} /><Info label="Data de início" value={fmt(projeto?.data_inicio)} /><Info label="Data de término" value={fmt(projeto?.data_fim)} /></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Card label="Atividades" value={atividades.length} /><Card label="Atendidos" value={atendidos.length} /><Card label="Encontros realizados" value={encontrosRealizados.length} /><Card label="Frequência média" value={`${frequenciaMedia}%`} /><Card label="Fotos" value={fotos.length} /><Card label="Metas cumpridas" value={metasCumpridas} /><Card label="Pendências" value={pendencias.length} /></div></section>
    <section className="p-8 page-break"><h2 className="text-2xl font-bold border-b pb-2 mb-4">Resumo executivo</h2><p className="text-sm leading-6 whitespace-pre-wrap">{resumo}</p></section>
    {!!opts.atividades && <section className="p-8 page-break"><h2 className="text-2xl font-bold border-b pb-2 mb-4">Atividades do projeto</h2><div className="space-y-4">{atividades.map((a: any) => { const eAtiv = encontros.filter((e: any) => e.atividade_id === a.id); const pAtiv = presencas.filter((p: any) => p.atividade_id === a.id); const presentes = pAtiv.filter((p: any) => p.status === "presente").length; const validas = pAtiv.filter((p: any) => p.status === "presente" || p.status === "falta").length; const eds = educadores.filter((e: any) => e.atividade_id === a.id).map((e: any) => e.profiles?.nome).filter(Boolean); return <div key={a.id} className="border rounded p-3 break-safe"><h3 className="font-bold text-lg">{a.titulo}</h3><div className="grid grid-cols-2 gap-2 text-xs mt-2"><Info label="Categoria" value={a.tipo} /><Info label="Educadores" value={eds.join(", ") || "—"} /><Info label="Período" value={[a.data_inicio && fmt(a.data_inicio), a.data_fim && fmt(a.data_fim)].filter(Boolean).join(" a ")} /><Info label="Local" value={a.local} /><Info label="Carga horária" value={`${a.carga_horaria_horas ?? 0}h ${a.carga_horaria_minutos ?? 0}min`} /><Info label="Inscritos" value={inscritos.filter((i: any) => i.atividade_id === a.id && i.status === "inscrito").length} /><Info label="Encontros realizados" value={eAtiv.filter((e: any) => e.status === "realizada").length} /><Info label="Frequência média" value={`${validas ? Math.round((presentes / validas) * 100) : 0}%`} /><Info label="Status" value={a.status} /></div>{a.descricao && <p className="text-sm mt-3 whitespace-pre-wrap">{a.descricao}</p>}</div>; })}</div></section>}
    {!!opts.metas && <section className="p-8 page-break"><h2 className="text-2xl font-bold border-b pb-2 mb-4">Metas e indicadores</h2><table className="w-full text-xs border-collapse mb-6"><thead className="bg-gray-100"><tr><Th>Meta</Th><Th>Prevista</Th><Th>Realizada</Th><Th>%</Th><Th>Status</Th><Th>Observações</Th></tr></thead><tbody>{metas.map((m: any) => { const pctMeta = Number(m.quantidade_prevista) ? Math.round((Number(m.quantidade_realizada ?? 0) / Number(m.quantidade_prevista)) * 100) : 0; return <tr key={m.id}><Td>{m.meta}</Td><Td>{m.quantidade_prevista}</Td><Td>{m.quantidade_realizada}</Td><Td>{pctMeta}%</Td><Td>{m.status}</Td><Td>{m.observacoes}</Td></tr>; })}{!metas.length && <tr><Td colSpan={6}>Nenhuma meta cadastrada.</Td></tr>}</tbody></table><div className="grid grid-cols-2 gap-4 text-sm"><Indicator title="Atendidos por cidade" rows={groupCount(atendidos, "cidade")} /><Indicator title="Atendidos por gênero" rows={groupCount(atendidos, "genero")} /><Indicator title="Atendidos por faixa etária" rows={groupAge(atendidos)} /><Indicator title="Atividades por mês" rows={groupMonth(encontros)} /></div></section>}
    {!!opts.atendidos && <section className="p-8 page-break"><h2 className="text-2xl font-bold border-b pb-2 mb-4">Lista consolidada de atendidos</h2><table className="w-full text-xs border-collapse"><thead className="bg-gray-100"><tr><Th>Nº</Th><Th>Nome</Th><Th>Gênero</Th><Th>Idade</Th><Th>Cidade</Th><Th>Atividade vinculada</Th><Th>Frequência</Th></tr></thead><tbody>{inscritos.map((i: any, idx: number) => { const a = atividadesPorId.get(i.atividade_id); const ps = presencas.filter((p: any) => p.atendido_id === i.atendidos?.id && p.atividade_id === i.atividade_id); const validas = ps.filter((p: any) => p.status === "presente" || p.status === "falta").length; const presentes = ps.filter((p: any) => p.status === "presente").length; return <tr key={`${i.atividade_id}-${i.atendidos?.id}-${idx}`}><Td>{idx + 1}</Td><Td>{i.atendidos?.nome}</Td><Td>{i.atendidos?.genero}</Td><Td>{calcularIdade(i.atendidos?.data_nascimento) ?? "—"}</Td><Td>{i.atendidos?.cidade}</Td><Td>{a?.titulo}</Td><Td>{validas ? `${Math.round((presentes / validas) * 100)}%` : "—"}</Td></tr>; })}</tbody></table></section>}
    {!!opts.fotos && <section className="p-8 page-break"><h2 className="text-2xl font-bold border-b pb-2 mb-4">Galeria do projeto</h2><div className="grid grid-cols-2 gap-3">{fotos.map((f: any, idx: number) => { const a = atividadesPorId.get(f.atividade_id); return <div key={idx} className="border border-blue-600 break-safe"><img src={f.url} alt={f.legenda ?? ""} className="w-full h-48 object-cover" /><div className="text-xs p-2">{f.legenda || "Sem legenda"}<br />{a?.titulo ?? projeto?.titulo} {f.data_foto ? `• ${fmt(f.data_foto)}` : ""}</div></div>; })}</div></section>}
    {!!opts.pendencias && <section className="p-8 page-break"><h2 className="text-2xl font-bold border-b pb-2 mb-4">Pendências e observações</h2>{pendencias.length ? <ul className="list-disc pl-5 text-sm space-y-1">{pendencias.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul> : <p className="text-sm">Nenhuma pendência automática identificada.</p>}<div className="mt-8 border rounded p-4 min-h-32"><div className="font-semibold mb-2">Observações do gestor</div></div></section>}
    <section className="p-8 page-break"><h2 className="text-2xl font-bold border-b pb-2 mb-8">Assinatura</h2><div className="text-sm space-y-6"><p>Responsável pelo relatório:</p><p>Nome: ________________________________________________</p><p>Cargo: ________________________________________________</p><p>Data: ____/____/________</p><p className="pt-8">Assinatura: _________________________________________</p></div></section>
  </div>;
}

function buildPendencias(atividades: any[], encontros: any[], fotos: any[], metas: any[], atendidos: any[]) {
  const out: string[] = [];
  atividades.filter((a) => a.status !== "finalizada").forEach((a) => out.push(`Atividade sem fechamento: ${a.titulo}`));
  encontros.filter((e) => e.status === "nao_registrada").forEach((e) => out.push(`Encontro não registrado em ${fmt(e.data)}.`));
  atividades.filter((a) => !fotos.some((f) => f.atividade_id === a.id)).forEach((a) => out.push(`Atividade sem foto no período: ${a.titulo}`));
  atendidos.filter((a) => !a.genero || !a.data_nascimento || !a.cidade).forEach((a) => out.push(`Atendido com dados incompletos: ${a.nome}`));
  metas.filter((m) => Number(m.quantidade_realizada ?? 0) < Number(m.quantidade_prevista ?? 0)).forEach((m) => out.push(`Meta pendente: ${m.meta}`));
  return out;
}
function fmt(v?: string | null) { return v ? new Date(`${v}T00:00:00`).toLocaleDateString("pt-BR") : "—"; }
function slug(v: string) { return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").toLowerCase(); }
function groupCount(rows: any[], key: string) { const map = new Map<string, number>(); rows.forEach((r) => map.set(r[key] || "Não informado", (map.get(r[key] || "Não informado") ?? 0) + 1)); return [...map.entries()]; }
function groupAge(rows: any[]) { const map = new Map<string, number>([["0 a 12", 0], ["13 a 17", 0], ["18 a 59", 0], ["60+", 0], ["Não informado", 0]]); rows.forEach((r) => { const idade = calcularIdade(r.data_nascimento); const k = idade == null ? "Não informado" : idade <= 12 ? "0 a 12" : idade <= 17 ? "13 a 17" : idade <= 59 ? "18 a 59" : "60+"; map.set(k, (map.get(k) ?? 0) + 1); }); return [...map.entries()].filter(([, v]) => v > 0); }
function groupMonth(rows: any[]) { const map = new Map<string, number>(); rows.forEach((r) => { const k = r.data ? r.data.slice(0, 7) : "Sem data"; map.set(k, (map.get(k) ?? 0) + 1); }); return [...map.entries()]; }
function Info({ label, value }: { label: string; value: any }) { return <div><div className="text-[10px] uppercase text-gray-500">{label}</div><div>{value || "—"}</div></div>; }
function Card({ label, value }: { label: string; value: any }) { return <div className="border rounded p-3"><div className="text-[10px] uppercase text-gray-500">{label}</div><div className="text-2xl font-bold">{value}</div></div>; }
function Indicator({ title, rows }: { title: string; rows: [string, number][] }) { return <div className="border rounded p-3 break-safe"><h3 className="font-semibold mb-2">{title}</h3>{rows.map(([k, v]) => <div key={k} className="flex justify-between border-t py-1"><span>{k}</span><b>{v}</b></div>)}</div>; }
function Th({ children }: any) { return <th className="border p-2 text-left">{children}</th>; }
function Td({ children, colSpan }: any) { return <td colSpan={colSpan} className="border p-2 align-top">{children ?? "—"}</td>; }
