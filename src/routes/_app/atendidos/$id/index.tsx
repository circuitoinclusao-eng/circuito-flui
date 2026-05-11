import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { calcularIdade, hideCPF, maskCPF, statusClass, statusLabel } from "@/lib/atendidos";
import { Pencil, FileDown, Plus, Camera, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/atendidos/$id/")({ component: DetalheAtendido });

function DetalheAtendido() {
  const { id } = Route.useParams();
  const { canEdit } = useAuth();
  const [r, setR] = useState<any>(null);
  const [marc, setMarc] = useState<string[]>([]);
  const [vinc, setVinc] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [hist, setHist] = useState<any[]>([]);
  const [presencas, setPresencas] = useState<any[]>([]);
  const [showCPF, setShowCPF] = useState(false);
  const [openAtend, setOpenAtend] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("atendidos").select("*").eq("id", id).maybeSingle();
    setR(data);
    const [{ data: m }, { data: v }, { data: d }, { data: h }, { data: p }] = await Promise.all([
      supabase.from("atendido_marcadores").select("marcador").eq("atendido_id", id),
      supabase.from("atendido_projetos").select("*,projetos(titulo),atividades(titulo),grupos(nome)").eq("atendido_id", id),
      supabase.from("atendido_documentos").select("*").eq("atendido_id", id).order("created_at", { ascending: false }),
      supabase.from("historico_atendimentos").select("*").eq("atendido_id", id).order("data", { ascending: false }),
      supabase.from("presencas").select("id,presente,observacao,atividade_id,atividades(titulo,data)").eq("contato_id", id),
    ]);
    setMarc((m ?? []).map((x: any) => x.marcador));
    setVinc(v ?? []); setDocs(d ?? []); setHist(h ?? []); setPresencas(p ?? []);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (!r) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  const idade = calcularIdade(r.data_nascimento);

  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">
        Início › <Link to="/atendidos" className="hover:underline">Atendidos</Link> › {r.nome}
      </nav>

      <div className="bg-card border rounded-xl p-5 mb-4 flex flex-col sm:flex-row gap-4 items-start">
        {r.foto_url
          ? <img src={r.foto_url} alt={r.nome} className="w-24 h-24 rounded-full object-cover" />
          : <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold"><Camera className="w-8 h-8" /></div>}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold">{r.nome}</h1>
          <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
            <span>Matrícula: <span className="font-mono">{r.matricula_familia || r.matricula}</span></span>
            {r.id_externo && <span>ID origem: <span className="font-mono">{r.id_externo}</span></span>}
            {r.genero && <span>{r.genero}</span>}
            {idade != null ? <span>{idade} anos</span> : r.idade_importada != null && <span>{r.idade_importada} anos</span>}
            {r.cidade && <span>{r.cidade}</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(r.status)}`}>{statusLabel(r.status)}</span>
            {marc.map((m) => <span key={m} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{m}</span>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {canEdit && <Button asChild size="sm"><Link to="/atendidos/$id/editar" params={{ id }}><Pencil className="w-4 h-4 mr-1" /> Editar</Link></Button>}
          {canEdit && <Button size="sm" variant="outline" onClick={() => setOpenAtend(true)}><Plus className="w-4 h-4 mr-1" /> Registrar atendimento</Button>}
          <Button size="sm" variant="outline" onClick={() => window.print()}><FileDown className="w-4 h-4 mr-1" /> Gerar ficha</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Dados principais" className="lg:col-span-2">
          <Grid>
            <Info k="Nome" v={r.nome} />
            <Info k="ID externo" v={r.id_externo} />
            <Info k="Matrícula" v={r.matricula_familia || r.matricula} />
            <Info k="Gênero" v={r.genero} />
            <Info k="Nascimento" v={r.data_nascimento ? new Date(r.data_nascimento).toLocaleDateString("pt-BR") : "—"} />
            <Info k="Idade" v={idade != null ? `${idade} anos` : (r.idade_importada != null ? `${r.idade_importada} anos (importada)` : "—")} />
            <Info k="CPF" v={
              <span className="font-mono inline-flex items-center gap-2">
                {showCPF ? maskCPF(r.cpf) : hideCPF(r.cpf)}
                <button onClick={() => setShowCPF(!showCPF)}>{showCPF ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
              </span>
            } />
            <Info k="RG" v={r.rg} />
            <Info k="Telefone" v={r.telefone} />
            <Info k="WhatsApp" v={r.whatsapp} />
            <Info k="E-mail" v={r.email} />
            <Info k="Cidade" v={r.cidade} />
            <Info k="Bairro" v={r.bairro} />
            <Info k="Endereço" v={r.endereco} />
            <Info k="CEP" v={r.cep} />
          </Grid>
        </Section>

        <Section title="Família / Responsável">
          <Grid cols={1}>
            <Info k="Responsável" v={r.responsavel_nome} />
            <Info k="Parentesco" v={r.responsavel_parentesco} />
            <Info k="Telefone" v={r.responsavel_telefone} />
            <Info k="E-mail" v={r.responsavel_email} />
            <Info k="Matrícula família" v={r.matricula_familia} />
            <Info k="Pessoas na família" v={r.numero_pessoas_familia} />
          </Grid>
          {r.observacoes_familiares && <p className="text-sm mt-3 whitespace-pre-wrap">{r.observacoes_familiares}</p>}
        </Section>

        <Section title="Acessibilidade" className="lg:col-span-3">
          <Grid>
            <Info k="PCD" v={r.pessoa_com_deficiencia?.replace("_", " ")} />
            <Info k="Tipo de deficiência" v={r.tipo_deficiencia} />
            <Info k="Mobilidade reduzida" v={r.mobilidade_reduzida ? "Sim" : "Não"} />
            <Info k="Cadeira de rodas" v={r.usa_cadeira_rodas ? "Sim" : "Não"} />
            <Info k="Comunicação alternativa" v={r.comunicacao_alternativa ? "Sim" : "Não"} />
            <Info k="Restrição de saúde" v={r.restricao_saude} />
          </Grid>
          {r.observacoes_acessibilidade && <p className="text-sm mt-3 whitespace-pre-wrap">{r.observacoes_acessibilidade}</p>}
        </Section>

        <Section title="Projetos vinculados" className="lg:col-span-2">
          {vinc.length === 0
            ? <p className="text-sm text-muted-foreground">Nenhum vínculo.</p>
            : <ul className="divide-y">{vinc.map((v: any) => (
                <li key={v.id} className="py-2 flex justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-medium text-sm">{v.projetos?.titulo ?? "Sem projeto"}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.atividades?.titulo && `${v.atividades.titulo} • `}
                      {v.grupos?.nome && `${v.grupos.nome} • `}
                      desde {v.data_entrada ? new Date(v.data_entrada).toLocaleDateString("pt-BR") : "—"}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted">{v.status}</span>
                </li>))}</ul>}
        </Section>

        <Section title="Histórico de presença">
          {presencas.length === 0
            ? <p className="text-sm text-muted-foreground">Sem registros.</p>
            : <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">
                {presencas.map((p: any) => (
                  <li key={p.id} className="flex justify-between border-b py-1">
                    <span className="truncate">{p.atividades?.titulo ?? "—"}</span>
                    <span className={p.presente ? "text-success" : "text-muted-foreground"}>{p.presente ? "Presente" : "Ausente"}</span>
                  </li>))}
              </ul>}
        </Section>

        <Section title="Histórico de atendimentos" className="lg:col-span-2">
          {hist.length === 0
            ? <p className="text-sm text-muted-foreground">Nenhum atendimento registrado.</p>
            : <ul className="divide-y">{hist.map((h) => (
                <li key={h.id} className="py-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{new Date(h.data).toLocaleDateString("pt-BR")}</span>
                    <span>{h.tipo}</span>
                  </div>
                  {h.demanda && <div className="text-sm mt-1"><strong>Demanda:</strong> {h.demanda}</div>}
                  {h.encaminhamento && <div className="text-sm"><strong>Encaminhamento:</strong> {h.encaminhamento}</div>}
                  {h.observacoes && <div className="text-sm text-muted-foreground mt-1">{h.observacoes}</div>}
                </li>))}</ul>}
        </Section>

        <Section title="Documentos">
          {docs.length === 0
            ? <p className="text-sm text-muted-foreground">Nenhum documento.</p>
            : <ul className="divide-y text-sm">{docs.map((d) => (
                <li key={d.id} className="py-2">
                  <a href={d.url} target="_blank" rel="noreferrer" className="hover:text-primary truncate block">
                    <span className="text-xs text-muted-foreground">[{d.tipo}]</span> {d.nome}
                  </a>
                </li>))}</ul>}
        </Section>

        {r.observacoes && (
          <Section title="Observações" className="lg:col-span-3">
            <p className="text-sm whitespace-pre-wrap">{r.observacoes}</p>
          </Section>
        )}
      </div>

      <NovoAtendimentoDialog open={openAtend} onClose={() => setOpenAtend(false)} atendidoId={id} reload={load} />
    </>
  );
}

function Section({ title, className = "", children }: any) {
  return (
    <section className={`bg-card border rounded-xl ${className}`}>
      <div className="px-5 py-3 border-b font-semibold text-sm">{title}</div>
      <div className="p-5">{children}</div>
    </section>
  );
}
function Grid({ children, cols = 2 }: any) {
  return <div className={`grid grid-cols-1 sm:grid-cols-${cols} gap-3 text-sm`}>{children}</div>;
}
function Info({ k, v }: any) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
      <div>{v ?? "—"}</div>
    </div>
  );
}

function NovoAtendimentoDialog({ open, onClose, atendidoId, reload }: any) {
  const [v, setV] = useState<any>({ data: new Date().toISOString().slice(0, 10), tipo: "individual" });
  async function save() {
    const { error } = await supabase.from("historico_atendimentos").insert({ ...v, atendido_id: atendidoId });
    if (error) toast.error(error.message); else { toast.success("Atendimento registrado."); reload(); onClose(); setV({ data: new Date().toISOString().slice(0, 10), tipo: "individual" }); }
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar atendimento</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data</Label><Input type="date" value={v.data} onChange={(e) => setV({ ...v, data: e.target.value })} /></div>
            <div><Label>Tipo</Label><Input value={v.tipo ?? ""} onChange={(e) => setV({ ...v, tipo: e.target.value })} /></div>
          </div>
          <div><Label>Demanda</Label><Textarea rows={2} value={v.demanda ?? ""} onChange={(e) => setV({ ...v, demanda: e.target.value })} /></div>
          <div><Label>Encaminhamento</Label><Textarea rows={2} value={v.encaminhamento ?? ""} onChange={(e) => setV({ ...v, encaminhamento: e.target.value })} /></div>
          <div><Label>Observações</Label><Textarea rows={2} value={v.observacoes ?? ""} onChange={(e) => setV({ ...v, observacoes: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
