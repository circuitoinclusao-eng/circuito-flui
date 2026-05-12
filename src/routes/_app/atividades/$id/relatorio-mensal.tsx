import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { statusEncontroLabel, calcularIdade } from "@/lib/atividades";
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
      const projeto = ativ?.projeto_id
        ? (await supabase.from("projetos").select("titulo,numero_projeto").eq("id", ativ.projeto_id).maybeSingle()).data
        : null;
      const { data: edu } = await supabase
        .from("atividade_educadores").select("usuario_id, profiles:usuario_id(nome)").eq("atividade_id", id);
      const { data: ges } = await supabase
        .from("atividade_gestores").select("usuario_id, profiles:usuario_id(nome)").eq("atividade_id", id);

      const encQ = supabase
        .from("encontros_atividade").select("*")
        .eq("atividade_id", id).gte("data", inicio).lte("data", fim).order("data");
      const { data: encontrosTodos } = await encQ;
      const encontros = (encontrosTodos ?? []).filter((e: any) => incNaoReg || e.status !== "nao_registrada");

      let presencasPorEnc: Record<string, any[]> = {};
      if (encontros.length) {
        const ids = encontros.map((e: any) => e.id);
        const { data: pr } = await supabase
          .from("presencas_atividade")
          .select("encontro_id, status, atendido_id, atendidos(nome)")
          .in("encontro_id", ids);
        (pr ?? []).forEach((p: any) => {
          (presencasPorEnc[p.encontro_id] ||= []).push(p);
        });
      }

      let inscritos: any[] = [];
      if (incInsc) {
        const { data: ins } = await supabase
          .from("atividade_inscritos")
          .select("status, data_inscricao, atendidos(nome,data_nascimento,telefone,cidade)")
          .eq("atividade_id", id).order("status");
        inscritos = ins ?? [];
      }

      let fotos: any[] = [];
      if (incFotos) {
        const { data: fo } = await supabase
          .from("atividade_fotos").select("url,legenda,data_foto,ordem")
          .eq("atividade_id", id).gte("data_foto", inicio).lte("data_foto", fim)
          .order("ordem", { ascending: true }).order("data_foto");
        fotos = fo ?? [];
      }

      // Carga horária do mês: soma horários dos encontros realizados
      let cargaMin = 0;
      encontros.forEach((e: any) => {
        if (e.status !== "realizada") return;
        if (e.horario_inicio && e.horario_fim) {
          const [h1, m1] = e.horario_inicio.split(":").map(Number);
          const [h2, m2] = e.horario_fim.split(":").map(Number);
          cargaMin += (h2 * 60 + m2) - (h1 * 60 + m1);
        }
      });

      const totalAtendidos = new Set<string>();
      Object.values(presencasPorEnc).flat().forEach((p: any) => {
        if (p.status === "presente") totalAtendidos.add(p.atendido_id);
      });

      setData({
        ativ, projeto,
        educadores: (edu ?? []).map((r: any) => r.profiles?.nome).filter(Boolean),
        gestores: (ges ?? []).map((r: any) => r.profiles?.nome).filter(Boolean),
        encontros, presencasPorEnc, inscritos, fotos,
        cargaMin, totalAtendidos: totalAtendidos.size,
      });

      const nome = (ativ?.titulo ?? "atividade").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
      document.title = `relatorio_mensal_${nome}_${String(mes).padStart(2, "0")}_${ano}`;
    })();
  }, [id, mes, ano, incInsc, incFotos, incNaoReg]);

  if (!data) return <div className="p-8 text-muted-foreground">Carregando relatório...</div>;
  const { ativ, projeto, educadores, gestores, encontros, presencasPorEnc, inscritos, fotos, cargaMin, totalAtendidos } = data;
  const periodo = [ativ.periodo_matutino && "Matutino", ativ.periodo_vespertino && "Vespertino", ativ.periodo_noturno && "Noturno"].filter(Boolean).join(", ") || "—";
  const horas = Math.floor(cargaMin / 60), mins = cargaMin % 60;

  return (
    <div className="bg-white text-black max-w-[210mm] mx-auto print:max-w-none print:mx-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 16mm 14mm 22mm; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          body { background: white; }
          .footer-page { position: fixed; bottom: 6mm; right: 14mm; font-size: 10px; color: #555; }
        }
        .footer-page::after { content: "Página " counter(page); }
      `}</style>

      <div className="no-print sticky top-0 bg-card border-b px-4 py-2 flex items-center justify-between gap-2 z-10">
        <div className="text-sm text-muted-foreground">Pré-visualização do relatório mensal — use o botão para imprimir ou salvar em PDF.</div>
        <Button size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Imprimir / Salvar PDF</Button>
      </div>

      <div className="footer-page" />

      {/* CAPA */}
      <section className="p-8">
        <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Relatório Mensal</div>
        <h1 className="text-3xl font-bold mb-1">{ativ.titulo}</h1>
        <div className="text-lg text-gray-700 mb-6">{MESES[mes - 1]} de {ano}</div>
        {ativ.foto_capa_url && (
          <img src={ativ.foto_capa_url} alt="" className="w-full max-h-72 object-cover rounded-lg border mb-6" />
        )}
        <table className="w-full text-sm border-collapse">
          <tbody>
            <Row k="Projeto" v={projeto ? `${projeto.titulo}${projeto.numero_projeto ? ` (nº ${projeto.numero_projeto})` : ""}` : "—"} />
            <Row k="Categoria / Modalidade" v={ativ.tipo ?? "—"} />
            <Row k="Período" v={periodo} />
            <Row k="Local" v={ativ.local ?? "—"} />
            <Row k="Carga horária do mês" v={`${horas}h${mins ? ` ${mins}min` : ""}`} />
            <Row k="Total de atendidos no mês" v={totalAtendidos} />
            <Row k="Encontros no mês" v={encontros.length} />
            <Row k="Educadores" v={educadores.join(", ") || "—"} />
            <Row k="Gestores" v={gestores.join(", ") || "—"} />
          </tbody>
        </table>
        {ativ.descricao && (
          <div className="mt-6">
            <h3 className="font-semibold text-sm uppercase text-gray-500 mb-1">Descrição</h3>
            <p className="text-sm whitespace-pre-wrap">{ativ.descricao}</p>
          </div>
        )}
      </section>

      {/* ENCONTROS */}
      <section className="p-8 page-break">
        <h2 className="text-xl font-bold mb-3 border-b pb-2">Encontros / Aulas do mês</h2>
        {encontros.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum encontro no período.</p>
        ) : (
          <div className="space-y-4">
            {encontros.map((e: any) => {
              const pres = presencasPorEnc[e.id] ?? [];
              const presentes = pres.filter((p: any) => p.status === "presente");
              return (
                <div key={e.id} className="border rounded-lg p-3 break-inside-avoid">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="font-semibold">
                      {new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      {e.horario_inicio && ` • ${e.horario_inicio.slice(0, 5)}${e.horario_fim ? "–" + e.horario_fim.slice(0, 5) : ""}`}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-100">{statusEncontroLabel(e.status)}</span>
                  </div>
                  {e.resumo && <p className="text-sm mb-2 whitespace-pre-wrap">{e.resumo}</p>}
                  <div className="text-xs text-gray-700">
                    <b>Frequência:</b> {presentes.length} presente(s) de {pres.length || e.numero_presentes || 0}
                  </div>
                  {presentes.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      <b>Participantes:</b> {presentes.map((p: any) => p.atendidos?.nome).filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* INSCRITOS */}
      {incInsc && (
        <section className="p-8 page-break">
          <h2 className="text-xl font-bold mb-3 border-b pb-2">Lista de inscritos</h2>
          {inscritos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum inscrito.</p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Nome</th>
                  <th className="border p-2 text-left">Idade</th>
                  <th className="border p-2 text-left">Telefone</th>
                  <th className="border p-2 text-left">Cidade</th>
                  <th className="border p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {inscritos.map((i: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border p-2">{i.atendidos?.nome ?? "—"}</td>
                    <td className="border p-2">{calcularIdade(i.atendidos?.data_nascimento) ?? "—"}</td>
                    <td className="border p-2">{i.atendidos?.telefone ?? "—"}</td>
                    <td className="border p-2">{i.atendidos?.cidade ?? "—"}</td>
                    <td className="border p-2">{i.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* FOTOS */}
      {incFotos && (
        <section className="p-8 page-break">
          <h2 className="text-xl font-bold mb-3 border-b pb-2">Galeria de fotos</h2>
          {fotos.length === 0 ? (
            <p className="text-sm text-gray-500">Sem fotos no período.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {fotos.map((f: any, idx: number) => (
                <div key={idx} className="break-inside-avoid border rounded">
                  <img src={f.url} alt={f.legenda ?? ""} className="w-full h-48 object-cover" />
                  {(f.legenda || f.data_foto) && (
                    <div className="text-xs p-1 text-gray-600">
                      {f.data_foto && <>{new Date(f.data_foto + "T00:00:00").toLocaleDateString("pt-BR")} • </>}
                      {f.legenda}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <tr>
      <td className="border p-2 bg-gray-50 font-medium w-1/3">{k}</td>
      <td className="border p-2">{v}</td>
    </tr>
  );
}
