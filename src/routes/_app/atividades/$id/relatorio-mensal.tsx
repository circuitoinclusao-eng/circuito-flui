import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { calcularIdade, statusEncontroLabel } from "@/lib/atividades";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const search = z.object({
  mes: z.coerce.number().min(1).max(12).default(new Date().getMonth() + 1),
  ano: z.coerce.number().min(2000).max(2100).default(new Date().getFullYear()),
  inscritos: z.coerce.number().default(1),
  fotos: z.coerce.number().default(1),
  naoRegistrados: z.coerce.number().default(0),
});

export const Route = createFileRoute("/_app/atividades/$id/relatorio-mensal")({
  validateSearch: (s) => search.parse(s),
  component: RelatorioMensal,
});

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function RelatorioMensal() {
  const { id } = Route.useParams();
  const { mes, ano, inscritos: incInsc, fotos: incFotos, naoRegistrados: incNaoReg } = Route.useSearch();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
      const fimDate = new Date(ano, mes, 0);
      const fim = `${ano}-${String(mes).padStart(2, "0")}-${String(fimDate.getDate()).padStart(2, "0")}`;
      const { data: ativ } = await supabase.from("atividades").select("*").eq("id", id).maybeSingle();
      const projeto = ativ?.projeto_id ? (await supabase.from("projetos").select("titulo,numero_projeto").eq("id", ativ.projeto_id).maybeSingle()).data : null;
      const { data: edu } = await supabase.from("atividade_educadores").select("usuario_id, profiles:usuario_id(nome)").eq("atividade_id", id);
      const { data: ges } = await supabase.from("atividade_gestores").select("usuario_id, profiles:usuario_id(nome)").eq("atividade_id", id);
      const { data: encontrosTodos } = await supabase.from("encontros_atividade").select("*").eq("atividade_id", id).gte("data", inicio).lte("data", fim).order("data");
      const encontros = (encontrosTodos ?? []).filter((e: any) => incNaoReg || e.status !== "nao_registrada");
      let presencasPorEnc: Record<string, any[]> = {};
      if (encontros.length) {
        const { data: pr } = await supabase.from("presencas_atividade").select("encontro_id, status, atendido_id, atendidos(nome)").in("encontro_id", encontros.map((e: any) => e.id));
        (pr ?? []).forEach((p: any) => { (presencasPorEnc[p.encontro_id] ||= []).push(p); });
      }
      let inscritos: any[] = [];
      if (incInsc) {
        const { data: ins } = await supabase.from("atividade_inscritos").select("status, data_inscricao, atendidos(nome,genero,data_nascimento,cidade)").eq("atividade_id", id).order("status");
        inscritos = ins ?? [];
      }
      let fotos: any[] = [];
      if (incFotos) {
        const { data: fo } = await supabase.from("atividade_fotos").select("url,legenda,data_foto,ordem").eq("atividade_id", id).gte("data_foto", inicio).lte("data_foto", fim).order("ordem", { ascending: true }).order("data_foto");
        fotos = fo ?? [];
      }
      let cargaMin = 0;
      encontros.forEach((e: any) => { if (e.status === "realizada") cargaMin += minutosEncontro(e); });
      const totalAtendidos = new Set<string>();
      Object.values(presencasPorEnc).flat().forEach((p: any) => { if (p.status === "presente") totalAtendidos.add(p.atendido_id); });
      setData({ ativ, projeto, educadores: (edu ?? []).map((r: any) => r.profiles?.nome).filter(Boolean), gestores: (ges ?? []).map((r: any) => r.profiles?.nome).filter(Boolean), encontros, presencasPorEnc, inscritos, fotos, fotoPrincipal: ativ?.foto_capa_url || fotos[0]?.url || null, cargaMin, totalAtendidos: totalAtendidos.size });
      const nome = (ativ?.titulo ?? "atividade").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
      document.title = `relatorio_mensal_${nome}_${String(mes).padStart(2, "0")}_${ano}`;
    })();
  }, [id, mes, ano, incInsc, incFotos, incNaoReg]);

  if (!data) return <div className="p-8 text-muted-foreground">Carregando relatório...</div>;
  const { ativ, projeto, educadores, gestores, encontros, presencasPorEnc, inscritos, fotos, fotoPrincipal, cargaMin, totalAtendidos } = data;
  const periodo = [ativ.periodo_matutino && "Matutino", ativ.periodo_vespertino && "Vespertino", ativ.periodo_noturno && "Noturno"].filter(Boolean).join(", ") || "—";
  const horas = Math.floor(cargaMin / 60), mins = cargaMin % 60;

  return <div className="bg-white text-black max-w-[210mm] mx-auto print:max-w-none print:mx-0">
    <style>{`@media print{@page{size:A4;margin:16mm 14mm 22mm}.no-print{display:none!important}.page-break{page-break-before:always}body{background:white}.footer-page{position:fixed;bottom:6mm;left:14mm;right:14mm;font-size:10px;color:#555;display:flex;justify-content:space-between}}.footer-page .page::after{content:"Página " counter(page)}.break-safe{break-inside:avoid;page-break-inside:avoid}`}</style>
    <div className="no-print sticky top-0 bg-card border-b px-4 py-2 flex items-center justify-between gap-2 z-10"><div className="text-sm text-muted-foreground">Pré-visualização do relatório mensal — use o botão para imprimir ou salvar em PDF.</div><Button size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Imprimir / Salvar PDF</Button></div>
    <div className="footer-page"><span>Relatório mensal - mês de {MESES[mes - 1]} de {ano}</span><span className="page" /></div>
    <section className="p-8"><div className="text-sm font-bold text-blue-800 mb-6">Circuito Inclusão</div><h1 className="text-3xl font-bold mb-1">RELATÓRIO MENSAL - MÊS DE {MESES[mes - 1].toUpperCase()} DE {ano}</h1><div className="text-xl text-gray-700 mb-6">{ativ.titulo}</div>{fotoPrincipal && <img src={fotoPrincipal} alt="" className="w-full max-h-72 object-cover rounded-lg border mb-6" />}<div className="grid grid-cols-2 gap-3 mb-6"><Card label="Carga horária do mês" value={`${horas}h${mins ? ` ${mins}min` : ""}`} /><Card label="Total de atendidos/inscritos" value={inscritos.length || totalAtendidos} /></div><table className="w-full text-sm border-collapse"><tbody><Row k="Projeto" v={projeto ? `${projeto.titulo}${projeto.numero_projeto ? ` (nº ${projeto.numero_projeto})` : ""}` : "—"} /><Row k="Gestores" v={gestores.join(", ") || "—"} /><Row k="Educadores" v={educadores.join(", ") || "—"} /><Row k="Categoria" v={ativ.tipo ?? "—"} /><Row k="Quem pode participar" v={ativ.quem_pode_participar ?? "—"} /><Row k="Período" v={periodo} /><Row k="Local" v={ativ.local ?? "—"} /><Row k="Descrição" v={ativ.descricao ?? "—"} /></tbody></table></section>
    <section className="p-8 page-break"><h2 className="text-xl font-bold mb-3 border-b pb-2">Aulas do mês</h2>{encontros.length === 0 ? <p className="text-sm text-gray-500">Nenhum encontro no período.</p> : <div className="space-y-4">{encontros.map((e: any) => { const pres = presencasPorEnc[e.id] ?? []; const presentes = pres.filter((p: any) => p.status === "presente"); const dataAula = new Date(e.data + "T00:00:00"); return <div key={e.id} className="border rounded-lg p-3 break-safe"><div className="flex items-center justify-between flex-wrap gap-2 mb-2"><div className="font-semibold">Dia {String(dataAula.getDate()).padStart(2, "0")} de {MESES[dataAula.getMonth()]} de {dataAula.getFullYear()} - {dataAula.toLocaleDateString("pt-BR", { weekday: "long" })}{e.horario_inicio && ` • ${e.horario_inicio.slice(0, 5)}${e.horario_fim ? "–" + e.horario_fim.slice(0, 5) : ""}`}</div><span className="text-xs px-2 py-0.5 rounded-full border bg-gray-100">{statusEncontroLabel(e.status)}</span></div>{e.resumo && <p className="text-sm mb-2 whitespace-pre-wrap">{e.resumo}</p>}<div className="grid grid-cols-2 gap-2 text-xs text-gray-700"><div><b>Carga horária:</b> {labelCarga(e)}</div><div><b>Local:</b> {e.local ?? ativ.local ?? "—"}</div><div><b>Educador(es):</b> {educadores.join(", ") || "—"}</div><div><b>Frequência:</b> {presentes.length} presente(s) de {pres.length || e.numero_presentes || 0}</div></div>{presentes.length > 0 && <div className="text-xs text-gray-600 mt-1"><b>Participantes:</b> {presentes.map((p: any) => p.atendidos?.nome).filter(Boolean).join(", ")}</div>}</div>; })}</div>}</section>
    {incInsc && <section className="p-8 page-break"><h2 className="text-xl font-bold mb-3 border-b pb-2">Lista de inscritos</h2>{inscritos.length === 0 ? <p className="text-sm text-gray-500">Nenhum inscrito.</p> : <table className="w-full text-xs border-collapse"><thead className="bg-gray-100"><tr><Th>Número</Th><Th>Nome</Th><Th>Gênero</Th><Th>Idade</Th><Th>Inscrição</Th></tr></thead><tbody>{inscritos.map((i: any, idx: number) => <tr key={idx}><Td>{idx + 1}</Td><Td>{i.atendidos?.nome}</Td><Td>{i.atendidos?.genero}</Td><Td>{calcularIdade(i.atendidos?.data_nascimento) ?? "—"}</Td><Td>{i.data_inscricao ? new Date(i.data_inscricao + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</Td></tr>)}</tbody></table>}</section>}
    {incFotos && <section className="p-8 page-break"><h2 className="text-xl font-bold mb-3 border-b pb-2">Galeria de fotos</h2>{fotos.length === 0 ? <p className="text-sm text-gray-500">Sem fotos no período.</p> : <div className="grid grid-cols-2 gap-3">{fotos.map((f: any, idx: number) => <div key={idx} className="break-safe border border-blue-600 rounded"><img src={f.url} alt={f.legenda ?? ""} className="w-full h-48 object-cover" />{(f.legenda || f.data_foto) && <div className="text-xs p-2 text-gray-600">{f.data_foto && <>{new Date(f.data_foto + "T00:00:00").toLocaleDateString("pt-BR")} • </>}{f.legenda}</div>}</div>)}</div>}</section>}
  </div>;
}

function minutosEncontro(e: any) { if (!e.horario_inicio || !e.horario_fim) return 0; const [h1, m1] = e.horario_inicio.split(":").map(Number); const [h2, m2] = e.horario_fim.split(":").map(Number); return Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1)); }
function labelCarga(e: any) { const min = minutosEncontro(e); if (!min) return "—"; const h = Math.floor(min / 60), m = min % 60; return `${h}h${m ? ` ${m}min` : ""}`; }
function Row({ k, v }: { k: string; v: any }) { return <tr><td className="border p-2 bg-gray-50 font-medium w-1/3">{k}</td><td className="border p-2 whitespace-pre-wrap">{v}</td></tr>; }
function Card({ label, value }: { label: string; value: any }) { return <div className="border rounded p-3"><div className="text-[10px] uppercase text-gray-500">{label}</div><div className="text-2xl font-bold">{value}</div></div>; }
function Th({ children }: any) { return <th className="border p-2 text-left">{children}</th>; }
function Td({ children }: any) { return <td className="border p-2 align-top">{children ?? "—"}</td>; }
