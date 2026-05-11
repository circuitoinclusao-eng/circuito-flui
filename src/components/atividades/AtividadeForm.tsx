import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { FORMATO_EXECUCAO } from "@/lib/atividades";
import { CapaUpload } from "./CapaUpload";
import { toast } from "sonner";

interface Props {
  id?: string;
  initial?: any;
}

export function AtividadeForm({ id, initial }: Props) {
  const nav = useNavigate();
  const [v, setV] = useState<any>(initial ?? {
    status: "planejada",
    formato_execucao: "curso",
    controle_presenca: true,
    media_final_conceito: false,
    permite_ultrapassar_limite: false,
    periodo_matutino: false,
    periodo_vespertino: false,
    periodo_noturno: false,
    carga_horaria_horas: 0,
    carga_horaria_minutos: 0,
  });
  const [projetos, setProjetos] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(id);

  useEffect(() => {
    supabase.from("projetos").select("id,titulo,numero_projeto").order("titulo").then(({ data }) => setProjetos(data ?? []));
  }, []);

  function set(k: string, val: any) { setV((p: any) => ({ ...p, [k]: val })); }

  async function submit(e: React.FormEvent, andContinue = false) {
    e.preventDefault();
    setBusy(true);
    const payload: any = { ...v };
    ["numero_vagas", "carga_horaria_horas", "carga_horaria_minutos"].forEach((k) => {
      if (payload[k] === "" || payload[k] == null) payload[k] = null;
      else payload[k] = Number(payload[k]);
    });
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });

    let resultId = savedId;
    if (savedId) {
      const { error } = await supabase.from("atividades").update(payload).eq("id", savedId);
      if (error) { toast.error(error.message); setBusy(false); return; }
    } else {
      if (!payload.titulo) { toast.error("Informe o nome da atividade."); setBusy(false); return; }
      const { data, error } = await supabase.from("atividades").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setBusy(false); return; }
      resultId = data.id;
      setSavedId(resultId);
    }
    setBusy(false);
    toast.success("Atividade salva.");
    if (!andContinue && resultId) {
      nav({ to: "/atividades/$id", params: { id: resultId } });
    }
  }

  async function excluir() {
    if (!savedId || !confirm("Excluir esta atividade? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("atividades").delete().eq("id", savedId);
    if (error) { toast.error(error.message); return; }
    toast.success("Atividade excluída.");
    nav({ to: "/atividades" });
  }

  return (
    <form onSubmit={(e) => submit(e, false)} className="space-y-6">
      {/* BLOCO 1 - Dados gerais */}
      <Section title="1. Dados gerais">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Nome da atividade *</Label>
            <Input required value={v.titulo ?? ""} onChange={(e) => set("titulo", e.target.value)} />
          </div>
          <div>
            <Label>Projeto vinculado</Label>
            <Select value={v.projeto_id ?? ""} onValueChange={(val) => set("projeto_id", val)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.titulo}{p.numero_projeto ? ` (nº ${p.numero_projeto})` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Input value={v.tipo ?? ""} onChange={(e) => set("tipo", e.target.value)} placeholder="Ex.: Esporte, Cultura..." />
          </div>
          <div className="md:col-span-2">
            <Label>Quem pode participar?</Label>
            <Textarea rows={2} value={v.quem_pode_participar ?? ""} onChange={(e) => set("quem_pode_participar", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Descreva como será a atividade</Label>
            <Textarea rows={3} value={v.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Objetivo do projeto que está relacionado</Label>
            <Textarea rows={2} value={v.objetivo_relacionado ?? ""} onChange={(e) => set("objetivo_relacionado", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Resultado esperado para a atividade</Label>
            <Textarea rows={2} value={v.resultado_esperado ?? ""} onChange={(e) => set("resultado_esperado", e.target.value)} />
          </div>
        </div>
      </Section>

      {/* BLOCO 2 - Responsáveis */}
      <Section title="2. Responsáveis">
        <p className="text-sm text-muted-foreground mb-3">
          Vincule educadores e gestores na tela de detalhe da atividade após salvar.
        </p>
        <div>
          <Label>Local</Label>
          <Input value={v.local ?? ""} onChange={(e) => set("local", e.target.value)} />
        </div>
      </Section>

      {/* BLOCO 3 - Configurações */}
      <Section title="3. Configurações da atividade">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <Label>Controle de presença</Label>
              <p className="text-xs text-muted-foreground">Habilita chamada por encontro.</p>
            </div>
            <Switch checked={v.controle_presenca} onCheckedChange={(c) => set("controle_presenca", c)} />
          </div>
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <Label>Apresentar média final como conceito?</Label>
              <p className="text-xs text-muted-foreground">Exibir conceito ao invés de nota.</p>
            </div>
            <Switch checked={v.media_final_conceito} onCheckedChange={(c) => set("media_final_conceito", c)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Formato de execução</Label>
              <Select value={v.formato_execucao} onValueChange={(val) => set("formato_execucao", val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATO_EXECUCAO.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Carga horária (horas)</Label>
              <Input type="number" min={0} value={v.carga_horaria_horas ?? 0} onChange={(e) => set("carga_horaria_horas", e.target.value)} />
            </div>
            <div>
              <Label>Carga horária (minutos)</Label>
              <Input type="number" min={0} max={59} value={v.carga_horaria_minutos ?? 0} onChange={(e) => set("carga_horaria_minutos", e.target.value)} />
            </div>
            <div>
              <Label>Número de vagas</Label>
              <Input type="number" min={0} value={v.numero_vagas ?? ""} onChange={(e) => set("numero_vagas", e.target.value)} />
            </div>
            <div className="flex items-center justify-between md:col-span-2 pt-6">
              <Label>Permite ultrapassar limite de vagas?</Label>
              <Switch checked={v.permite_ultrapassar_limite} onCheckedChange={(c) => set("permite_ultrapassar_limite", c)} />
            </div>
          </div>
        </div>
      </Section>

      {/* BLOCO 4 - Período */}
      <Section title="4. Período de ocorrência">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Data inicial</Label>
            <Input type="date" value={v.data_inicio ?? ""} onChange={(e) => set("data_inicio", e.target.value)} />
          </div>
          <div>
            <Label>Data final</Label>
            <Input type="date" value={v.data_fim ?? ""} onChange={(e) => set("data_fim", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className="mb-2 block">Em qual(is) período(s) ocorrerá?</Label>
            <div className="flex flex-wrap gap-4">
              {[
                { k: "periodo_matutino", l: "Matutino" },
                { k: "periodo_vespertino", l: "Vespertino" },
                { k: "periodo_noturno", l: "Noturno" },
              ].map((p) => (
                <label key={p.k} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={!!v[p.k]} onCheckedChange={(c) => set(p.k, !!c)} />
                  <span>{p.l}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* BLOCO 5 - Imagens */}
      <Section title="5. Imagens">
        {savedId ? (
          <CapaUpload
            atividadeId={savedId}
            fotoUrl={v.foto_capa_url}
            legenda={v.foto_capa_legenda}
            canEdit
            onChange={(url, legenda) => { set("foto_capa_url", url); set("foto_capa_legenda", legenda); }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Salve a atividade primeiro para enviar a foto de capa.</p>
        )}
      </Section>

      {/* Botões */}
      <div className="flex flex-wrap gap-2 justify-end pt-4 border-t bg-card sticky bottom-0 -mx-4 px-4 py-3 rounded-b-xl">
        {savedId && (
          <Button type="button" variant="destructive" onClick={excluir}>Excluir</Button>
        )}
        <Button type="button" variant="outline" onClick={() => nav({ to: "/atividades" })}>Cancelar</Button>
        <Button type="button" variant="secondary" onClick={(e) => submit(e, true)} disabled={busy}>Salvar e continuar</Button>
        <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Finalizar"}</Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border rounded-xl shadow-sm p-5">
      <h2 className="font-semibold text-lg mb-4 pb-2 border-b">{title}</h2>
      {children}
    </section>
  );
}
