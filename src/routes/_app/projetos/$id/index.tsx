import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/Cards";
import { RelatorioMonitoramentoDialog } from "@/components/projetos/RelatorioMonitoramentoDialog";

export const Route = createFileRoute("/_app/projetos/$id/")({
  component: View,
});

function View() {
  const { id } = Route.useParams();
  const [r, setR] = useState<any>(null);
  const [ativ, setAtiv] = useState<any[]>([]);
  const [relOpen, setRelOpen] = useState(false);

  useEffect(() => {
    supabase.from("projetos").select("*").eq("id", id).maybeSingle().then(({ data }) => setR(data));
    supabase.from("atividades").select("id,titulo,data,status,participantes_atendidos").eq("projeto_id", id).order("data", { ascending: false }).then(({ data }) => setAtiv(data ?? []));
  }, [id]);

  if (!r) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">Início › <Link to="/projetos" className="hover:underline">Projetos</Link> › {r.titulo}</nav>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-semibold">{r.titulo}</h1>
        <div className="flex gap-2 items-center">
          <StatusBadge status={r.status} />
          <Button variant="outline" size="sm" onClick={() => setRelOpen(true)}>Emitir relatório de monitoramento</Button>
          <Button asChild variant="outline" size="sm"><Link to="/projetos/$id/editar" params={{ id }}>Editar</Link></Button>
          <Button asChild size="sm"><Link to="/atividades/novo">+ Atividade</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-xl shadow-sm p-6 space-y-4">
          <Info label="Descrição" v={r.descricao} />
          <Info label="Objetivo geral" v={r.objetivo_geral} />
          <Info label="Objetivos específicos" v={r.objetivos_especificos} />
          <Info label="Metas" v={r.metas} />
          <Info label="Indicadores" v={r.indicadores} />
        </div>
        <div className="bg-card border rounded-xl shadow-sm p-6 space-y-3">
          <Info label="Número do projeto" v={r.numero_projeto} />
          <Info label="Cidade" v={r.cidade} />
          <Info label="Território" v={r.territorio} />
          <Info label="Público atendido" v={r.publico_alvo} />
          <Info label="Início" v={r.data_inicio ? new Date(r.data_inicio).toLocaleDateString("pt-BR") : "—"} />
          <Info label="Término" v={r.data_fim ? new Date(r.data_fim).toLocaleDateString("pt-BR") : "—"} />
          <Info label="Orçamento" v={r.orcamento_previsto ? `R$ ${Number(r.orcamento_previsto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"} />
        </div>
      </div>

      <div className="mt-6 bg-card border rounded-xl shadow-sm">
        <div className="px-5 py-3 border-b font-semibold">Atividades vinculadas</div>
        {ativ.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Nenhuma atividade. <Link to="/atividades/novo" className="text-primary hover:underline">Cadastrar</Link>.</div>
        ) : (
          <ul className="divide-y">
            {ativ.map((a) => (
              <li key={a.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <Link to="/atividades/$id" params={{ id: a.id }} className="font-medium hover:text-primary">{a.titulo}</Link>
                  <div className="text-xs text-muted-foreground">
                    {a.data ? new Date(a.data).toLocaleDateString("pt-BR") : "Sem data"} • {a.participantes_atendidos ?? 0} atendidos
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <RelatorioMonitoramentoDialog
        open={relOpen}
        onClose={() => setRelOpen(false)}
        projetoId={id}
        projetoNome={r.titulo}
      />
    </>
  );
}

function Info({ label, v }: any) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-sm whitespace-pre-wrap">{v ?? "—"}</div>
    </div>
  );
}
