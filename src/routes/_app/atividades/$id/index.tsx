import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CapaUpload } from "@/components/atividades/CapaUpload";
import { CalendarioEncontros } from "@/components/atividades/CalendarioEncontros";
import { ListaInscritos } from "@/components/atividades/ListaInscritos";
import { GaleriaAtividade } from "@/components/atividades/GaleriaAtividade";
import { RelatorioMensalDialog } from "@/components/atividades/RelatorioMensalDialog";
import { Pencil, FileDown, Printer, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { downloadCSV, calcularIdade, statusEncontroLabel } from "@/lib/atividades";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/atividades/$id/")({
  component: AtividadeDetalhe,
});

function AtividadeDetalhe() {
  const { id } = Route.useParams();
  const { canEdit } = useAuth();
  const [ativ, setAtiv] = useState<any>(null);
  const [projeto, setProjeto] = useState<any>(null);
  const [educadores, setEducadores] = useState<string[]>([]);
  const [gestores, setGestores] = useState<string[]>([]);
  const [relMensalOpen, setRelMensalOpen] = useState(false);

  const load = useCallback(async () => {
    const { data: a } = await supabase.from("atividades").select("*").eq("id", id).maybeSingle();
    setAtiv(a);
    if (a?.projeto_id) {
      const { data: p } = await supabase.from("projetos").select("id,titulo,numero_projeto").eq("id", a.projeto_id).maybeSingle();
      setProjeto(p);
    } else {
      setProjeto(null);
    }
    const { data: edu } = await supabase
      .from("atividade_educadores").select("usuario_id, profiles:usuario_id(nome)").eq("atividade_id", id);
    setEducadores((edu ?? []).map((r: any) => r.profiles?.nome).filter(Boolean));
    const { data: ges } = await supabase
      .from("atividade_gestores").select("usuario_id, profiles:usuario_id(nome)").eq("atividade_id", id);
    setGestores((ges ?? []).map((r: any) => r.profiles?.nome).filter(Boolean));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function gerarRelInscritos() {
    const { data } = await supabase
      .from("atividade_inscritos")
      .select("status, data_inscricao, atendidos(nome, data_nascimento, telefone, cidade)")
      .eq("atividade_id", id);
    const rows: (string | number | null)[][] = [["Nome", "Idade", "Telefone", "Cidade", "Status", "Data inscrição"]];
    (data ?? []).forEach((i: any) => {
      rows.push([
        i.atendidos?.nome ?? "",
        calcularIdade(i.atendidos?.data_nascimento) ?? "",
        i.atendidos?.telefone ?? "",
        i.atendidos?.cidade ?? "",
        i.status,
        i.data_inscricao ? new Date(i.data_inscricao).toLocaleDateString("pt-BR") : "",
      ]);
    });
    downloadCSV(`inscritos-${ativ.titulo}.csv`, rows);
  }

  async function gerarRelPresenca() {
    const { data } = await supabase
      .from("encontros_atividade")
      .select("data, status, numero_presentes, resumo")
      .eq("atividade_id", id)
      .order("data");
    const rows: (string | number | null)[][] = [["Data", "Status", "Presentes", "Resumo"]];
    (data ?? []).forEach((e: any) => {
      rows.push([
        new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR"),
        statusEncontroLabel(e.status),
        e.numero_presentes ?? 0,
        e.resumo ?? "",
      ]);
    });
    downloadCSV(`presenca-${ativ.titulo}.csv`, rows);
    toast.success("Relatório gerado.");
  }

  if (!ativ) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">
        Início ›{" "}
        {projeto && <><Link to="/projetos/$id" params={{ id: projeto.id }} className="hover:underline">{projeto.titulo}</Link> › </>}
        <Link to="/atividades" className="hover:underline">Atividades</Link> › {ativ.titulo}
      </nav>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">
            Detalhe de {ativ.titulo}
            {projeto?.numero_projeto && <span className="text-muted-foreground"> — Projeto nº {projeto.numero_projeto}</span>}
          </h1>
          {projeto && (
            <p className="text-sm text-muted-foreground mt-1">
              Projeto: <Link to="/projetos/$id" params={{ id: projeto.id }} className="text-primary hover:underline">{projeto.titulo}</Link>
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link to="/atividades/$id/relatorio" params={{ id }}><FileDown className="w-4 h-4 mr-1" /> Relatório completo</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><FileDown className="w-4 h-4 mr-1" /> Exportar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRelMensalOpen(true)}>
                <FileText className="w-4 h-4 mr-2" /> Relatório mensal da atividade (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={gerarRelInscritos}>Lista de inscritos (CSV)</DropdownMenuItem>
              <DropdownMenuItem onClick={gerarRelPresenca}>Relatório de presença (CSV)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Imprimir / PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canEdit && (
            <Button asChild size="sm">
              <Link to="/atividades/$id/editar" params={{ id }}><Pencil className="w-4 h-4 mr-1" /> Editar atividade</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Capa */}
      <div className="mb-6">
        <CapaUpload
          atividadeId={id}
          fotoUrl={ativ.foto_capa_url}
          legenda={ativ.foto_capa_legenda}
          canEdit={canEdit}
          onChange={(url, legenda) => setAtiv({ ...ativ, foto_capa_url: url, foto_capa_legenda: legenda })}
        />
        {ativ.foto_capa_legenda && (
          <p className="text-xs text-muted-foreground italic mt-1 text-center">{ativ.foto_capa_legenda}</p>
        )}
      </div>

      {/* Resumo da atividade */}
      <div className="bg-card border rounded-xl shadow-sm p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <Stat label="Formato" value={ativ.formato_execucao === "curso" ? "Curso" : "Atividade única"} />
        <Stat label="Vagas" value={ativ.numero_vagas ?? "—"} />
        <Stat label="Carga horária" value={`${ativ.carga_horaria_horas ?? 0}h${ativ.carga_horaria_minutos ? ` ${ativ.carga_horaria_minutos}min` : ""}`} />
        <Stat label="Presença" value={ativ.controle_presenca ? "Ativada" : "Desativada"} />
        {(ativ.data_inicio || ativ.data_fim) && (
          <Stat label="Período" value={`${ativ.data_inicio ? new Date(ativ.data_inicio + "T00:00:00").toLocaleDateString("pt-BR") : "?"} → ${ativ.data_fim ? new Date(ativ.data_fim + "T00:00:00").toLocaleDateString("pt-BR") : "?"}`} />
        )}
        <Stat label="Períodos" value={[ativ.periodo_matutino && "Matutino", ativ.periodo_vespertino && "Vespertino", ativ.periodo_noturno && "Noturno"].filter(Boolean).join(", ") || "—"} />
        {ativ.local && <Stat label="Local" value={ativ.local} />}
      </div>

      {ativ.descricao && (
        <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-2">Descrição</h3>
          <p className="text-sm whitespace-pre-wrap">{ativ.descricao}</p>
        </div>
      )}

      <div className="space-y-6">
        <CalendarioEncontros atividadeId={id} controlePresenca={!!ativ.controle_presenca} canEdit={canEdit} />
        <ListaInscritos atividadeId={id} canEdit={canEdit} numeroVagas={ativ.numero_vagas} />
        <GaleriaAtividade atividadeId={id} canEdit={canEdit} />
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}
