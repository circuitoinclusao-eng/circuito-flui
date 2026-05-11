import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PROJETO_STATUS, PRESTACAO_STATUS } from "@/lib/projetos";

interface Props {
  id?: string;
  onSaved?: (id: string) => void;
}

const TIPOS = ["Educacional", "Cultural", "Esportivo", "Saúde", "Inclusão", "Assistência social", "Outro"];

export function ProjetoForm({ id, onSaved }: Props) {
  const nav = useNavigate();
  const [v, setV] = useState<any>({ status: "em_elaboracao", lei_incentivo: false, situacao_prestacao_contas: "nao_iniciada" });
  const [busy, setBusy] = useState(false);
  const [editais, setEditais] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("editais").select("id,titulo,organizacao").order("titulo").then(({ data }) => setEditais(data ?? []));
    supabase.from("profiles").select("id,nome").order("nome").then(({ data }) => setProfiles(data ?? []));
    if (id) supabase.from("projetos").select("*").eq("id", id).maybeSingle().then(({ data }) => { if (data) setV(data); });
  }, [id]);

  function set(k: string, val: any) { setV((p: any) => ({ ...p, [k]: val })); }

  async function save() {
    if (!v.titulo?.trim()) return toast.error("Informe o nome do projeto.");
    setBusy(true);
    const payload: any = { ...v };
    // Cast numeric fields
    ["valor_solicitado", "valor_aprovado", "valor_captado", "valor_executado", "contrapartida", "orcamento_previsto", "atendidos_previstos", "atendidos_realizados"].forEach((k) => {
      if (payload[k] === "" || payload[k] == null) payload[k] = null;
      else payload[k] = Number(payload[k]);
    });
    let res;
    if (id) res = await supabase.from("projetos").update(payload).eq("id", id).select("id").single();
    else res = await supabase.from("projetos").insert(payload).select("id").single();
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(id ? "Projeto atualizado." : "Projeto criado.");
    if (onSaved) onSaved(res.data.id);
    else nav({ to: "/projetos/$id", params: { id: res.data.id } });
  }

  return (
    <div className="space-y-4">
      <Bloco title="1. Dados principais">
        <Grid>
          <Field label="Nome do projeto *" className="md:col-span-2">
            <Input value={v.titulo ?? ""} onChange={(e) => set("titulo", e.target.value)} />
          </Field>
          <Field label="Número do projeto"><Input value={v.numero_projeto ?? ""} onChange={(e) => set("numero_projeto", e.target.value)} /></Field>
          <Field label="ID externo"><Input value={v.id_externo ?? ""} onChange={(e) => set("id_externo", e.target.value)} /></Field>
          <Field label="Tipo de projeto">
            <Select value={v.tipo ?? ""} onValueChange={(x) => set("tipo", x)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={v.status ?? "em_elaboracao"} onValueChange={(x) => set("status", x)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROJETO_STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Cidade"><Input value={v.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} /></Field>
          <Field label="Território"><Input value={v.territorio ?? ""} onChange={(e) => set("territorio", e.target.value)} /></Field>
          <Field label="Local de execução" className="md:col-span-2"><Input value={v.local_execucao ?? ""} onChange={(e) => set("local_execucao", e.target.value)} /></Field>
          <Field label="Público-alvo" className="md:col-span-2"><Input value={v.publico_alvo ?? ""} onChange={(e) => set("publico_alvo", e.target.value)} /></Field>
          <Field label="Atendidos previstos"><Input type="number" value={v.atendidos_previstos ?? ""} onChange={(e) => set("atendidos_previstos", e.target.value)} /></Field>
          <Field label="Atendidos realizados"><Input type="number" value={v.atendidos_realizados ?? ""} onChange={(e) => set("atendidos_realizados", e.target.value)} /></Field>
          <Field label="Data de início"><Input type="date" value={v.data_inicio ?? ""} onChange={(e) => set("data_inicio", e.target.value)} /></Field>
          <Field label="Data de término"><Input type="date" value={v.data_fim ?? ""} onChange={(e) => set("data_fim", e.target.value)} /></Field>
          <Field label="Responsável (nome)"><Input value={v.responsavel_nome ?? ""} onChange={(e) => set("responsavel_nome", e.target.value)} /></Field>
          <Field label="Responsável (usuário)">
            <Select value={v.responsavel_id ?? "__none"} onValueChange={(x) => set("responsavel_id", x === "__none" ? null : x)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent><SelectItem value="__none">—</SelectItem>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Coordenador (nome)"><Input value={v.coordenador_nome ?? ""} onChange={(e) => set("coordenador_nome", e.target.value)} /></Field>
        </Grid>
        <Field label="Descrição resumida"><Textarea rows={2} value={v.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} /></Field>
      </Bloco>

      <Bloco title="2. Edital e fonte de recurso">
        <Grid>
          <Field label="Edital vinculado">
            <Select value={v.edital_id ?? "__none"} onValueChange={(x) => set("edital_id", x === "__none" ? null : x)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent><SelectItem value="__none">—</SelectItem>{editais.map((e) => <SelectItem key={e.id} value={e.id}>{e.titulo}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Edital (nome livre)"><Input value={v.edital_nome ?? ""} onChange={(e) => set("edital_nome", e.target.value)} /></Field>
          <Field label="Órgão / Empresa do edital"><Input value={v.orgao_edital ?? ""} onChange={(e) => set("orgao_edital", e.target.value)} /></Field>
          <Field label="Fonte de recurso"><Input value={v.fonte_recurso ?? ""} onChange={(e) => set("fonte_recurso", e.target.value)} /></Field>
          <Field label="Lei de incentivo">
            <div className="flex items-center gap-2 h-10">
              <Switch checked={!!v.lei_incentivo} onCheckedChange={(x) => set("lei_incentivo", x)} />
              <span className="text-sm">{v.lei_incentivo ? "Sim" : "Não"}</span>
            </div>
          </Field>
          <Field label="Qual lei de incentivo"><Input value={v.qual_lei_incentivo ?? ""} onChange={(e) => set("qual_lei_incentivo", e.target.value)} /></Field>
          <Field label="Número do processo"><Input value={v.numero_processo ?? ""} onChange={(e) => set("numero_processo", e.target.value)} /></Field>
          <Field label="Nº termo / contrato"><Input value={v.numero_termo ?? ""} onChange={(e) => set("numero_termo", e.target.value)} /></Field>
          <Field label="Patrocinador"><Input value={v.patrocinador ?? ""} onChange={(e) => set("patrocinador", e.target.value)} /></Field>
          <Field label="Parceiro institucional"><Input value={v.parceiro ?? ""} onChange={(e) => set("parceiro", e.target.value)} /></Field>
        </Grid>
      </Bloco>

      <Bloco title="3. Objetivos e metodologia">
        <Field label="Objetivo geral"><Textarea rows={2} value={v.objetivo_geral ?? ""} onChange={(e) => set("objetivo_geral", e.target.value)} /></Field>
        <Field label="Objetivos específicos"><Textarea rows={3} value={v.objetivos_especificos ?? ""} onChange={(e) => set("objetivos_especificos", e.target.value)} /></Field>
        <Field label="Justificativa"><Textarea rows={3} value={v.justificativa ?? ""} onChange={(e) => set("justificativa", e.target.value)} /></Field>
        <Field label="Metodologia"><Textarea rows={3} value={v.metodologia ?? ""} onChange={(e) => set("metodologia", e.target.value)} /></Field>
        <Field label="Resultados esperados"><Textarea rows={2} value={v.resultados_esperados ?? ""} onChange={(e) => set("resultados_esperados", e.target.value)} /></Field>
        <Field label="Impacto social esperado"><Textarea rows={2} value={v.impacto_social ?? ""} onChange={(e) => set("impacto_social", e.target.value)} /></Field>
        <Field label="Indicadores de impacto"><Textarea rows={2} value={v.indicadores ?? ""} onChange={(e) => set("indicadores", e.target.value)} /></Field>
      </Bloco>

      <Bloco title="4. Captação financeira">
        <Grid>
          <Field label="Valor solicitado"><Input type="number" step="0.01" value={v.valor_solicitado ?? ""} onChange={(e) => set("valor_solicitado", e.target.value)} /></Field>
          <Field label="Valor aprovado"><Input type="number" step="0.01" value={v.valor_aprovado ?? ""} onChange={(e) => set("valor_aprovado", e.target.value)} /></Field>
          <Field label="Valor captado"><Input type="number" step="0.01" value={v.valor_captado ?? ""} onChange={(e) => set("valor_captado", e.target.value)} /></Field>
          <Field label="Valor executado"><Input type="number" step="0.01" value={v.valor_executado ?? ""} onChange={(e) => set("valor_executado", e.target.value)} /></Field>
          <Field label="Contrapartida"><Input type="number" step="0.01" value={v.contrapartida ?? ""} onChange={(e) => set("contrapartida", e.target.value)} /></Field>
        </Grid>
        <Field label="Observações da captação"><Textarea rows={2} value={v.obs_captacao ?? ""} onChange={(e) => set("obs_captacao", e.target.value)} /></Field>
      </Bloco>

      <Bloco title="5. Prestação de contas">
        <Grid>
          <Field label="Situação">
            <Select value={v.situacao_prestacao_contas ?? "nao_iniciada"} onValueChange={(x) => set("situacao_prestacao_contas", x)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRESTACAO_STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Data limite"><Input type="date" value={v.data_limite_prestacao ?? ""} onChange={(e) => set("data_limite_prestacao", e.target.value)} /></Field>
        </Grid>
      </Bloco>

      <div className="flex flex-wrap justify-end gap-2 pt-2 sticky bottom-0 bg-background/80 backdrop-blur py-3 border-t">
        <Button variant="outline" onClick={() => nav({ to: "/projetos" })}>Cancelar</Button>
        <Button onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  );
}

function Bloco({ title, children }: any) {
  const [open, setOpen] = useState(true);
  return (
    <section className="bg-card border rounded-xl">
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-5 py-3 border-b flex items-center justify-between font-semibold text-sm">
        <span>{title}</span><span className="text-xs text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="p-5 space-y-3">{children}</div>}
    </section>
  );
}
function Grid({ children }: any) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>; }
function Field({ label, children, className = "" }: any) {
  return <div className={className}><Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
