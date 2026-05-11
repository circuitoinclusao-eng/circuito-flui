import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ATENDIDO_STATUS, PCD_OPTIONS, MARCADORES_PADRAO, TIPO_DOCUMENTO, calcularIdade } from "@/lib/atendidos";
import { Camera, Plus, Trash2, Upload, X } from "lucide-react";

type Props = { id?: string };

export function AtendidoForm({ id }: Props) {
  const nav = useNavigate();
  const [v, setV] = useState<any>({ status: "ativo", pessoa_com_deficiencia: "nao_informado" });
  const [marcadores, setMarcadores] = useState<string[]>([]);
  const [novoMarcador, setNovoMarcador] = useState("");
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [atividades, setAtividades] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const idade = calcularIdade(v.data_nascimento);

  useEffect(() => {
    supabase.from("projetos").select("id,titulo").order("titulo").then(({ data }) => setProjetos(data ?? []));
    supabase.from("grupos").select("id,nome").order("nome").then(({ data }) => setGrupos(data ?? []));
    supabase.from("atividades").select("id,titulo").order("titulo").then(({ data }) => setAtividades(data ?? []));
    if (id) {
      supabase.from("atendidos").select("*").eq("id", id).maybeSingle().then(({ data }) => data && setV(data));
      supabase.from("atendido_marcadores").select("marcador").eq("atendido_id", id).then(({ data }) => setMarcadores((data ?? []).map((m) => m.marcador)));
      supabase.from("atendido_projetos").select("*").eq("atendido_id", id).then(({ data }) => setVinculos(data ?? []));
      supabase.from("atendido_documentos").select("*").eq("atendido_id", id).order("created_at", { ascending: false }).then(({ data }) => setDocumentos(data ?? []));
    }
  }, [id]);

  function set(k: string, val: any) { setV((p: any) => ({ ...p, [k]: val })); }

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `fotos/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("atendidos").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("atendidos").getPublicUrl(path);
    set("foto_url", data.publicUrl);
  }

  async function uploadDoc(e: React.ChangeEvent<HTMLInputElement>, tipo: string) {
    if (!id) return toast.error("Salve o atendido antes de anexar documentos.");
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `docs/${id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("atendidos").upload(path, file);
    if (error) return toast.error(error.message);
    const { data: pub } = supabase.storage.from("atendidos").getPublicUrl(path);
    const { data, error: insErr } = await supabase.from("atendido_documentos")
      .insert({ atendido_id: id, nome: file.name, tipo, url: pub.publicUrl }).select().single();
    if (insErr) return toast.error(insErr.message);
    setDocumentos([data, ...documentos]);
    e.target.value = "";
  }

  async function delDoc(docId: string) {
    await supabase.from("atendido_documentos").delete().eq("id", docId);
    setDocumentos(documentos.filter((d) => d.id !== docId));
  }

  function addMarcador(m: string) {
    const t = m.trim();
    if (!t || marcadores.includes(t)) return;
    setMarcadores([...marcadores, t]);
    setNovoMarcador("");
  }

  function addVinculo() {
    setVinculos([...vinculos, { projeto_id: null, atividade_id: null, grupo_id: null, status: "ativo", data_entrada: new Date().toISOString().slice(0, 10) }]);
  }

  async function save() {
    if (!v.nome?.trim()) return toast.error("Informe o nome.");
    setBusy(true);
    try {
      // Anti-duplicidade
      if (!id && (v.cpf || (v.nome && v.data_nascimento))) {
        const q = supabase.from("atendidos").select("id");
        const { data: dup } = v.cpf
          ? await q.eq("cpf", v.cpf).limit(1)
          : await q.eq("nome", v.nome).eq("data_nascimento", v.data_nascimento).limit(1);
        if (dup?.length) {
          setBusy(false);
          return toast.error("Já existe um atendido com este CPF ou nome+data de nascimento.");
        }
      }

      const payload = { ...v };
      delete payload.matricula;
      delete payload.created_at;
      delete payload.updated_at;
      ["numero_pessoas_familia"].forEach((k) => { if (payload[k] === "" || payload[k] == null) delete payload[k]; else payload[k] = Number(payload[k]); });
      Object.keys(payload).forEach((k) => payload[k] === "" && (payload[k] = null));

      let atendidoId = id;
      if (id) {
        const { error } = await supabase.from("atendidos").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("atendidos").insert(payload).select().single();
        if (error) throw error;
        atendidoId = data.id;
      }

      // Marcadores: substituir
      await supabase.from("atendido_marcadores").delete().eq("atendido_id", atendidoId!);
      if (marcadores.length) {
        await supabase.from("atendido_marcadores").insert(marcadores.map((m) => ({ atendido_id: atendidoId!, marcador: m })));
      }

      // Vínculos: substituir
      await supabase.from("atendido_projetos").delete().eq("atendido_id", atendidoId!);
      const vinculosLimpos = vinculos.filter((vi) => vi.projeto_id || vi.atividade_id || vi.grupo_id);
      if (vinculosLimpos.length) {
        await supabase.from("atendido_projetos").insert(vinculosLimpos.map((vi) => ({
          atendido_id: atendidoId!, projeto_id: vi.projeto_id || null, atividade_id: vi.atividade_id || null,
          grupo_id: vi.grupo_id || null, data_entrada: vi.data_entrada || null, status: vi.status || "ativo",
        })));
      }

      toast.success("Atendido salvo.");
      nav({ to: "/atendidos/$id", params: { id: atendidoId! } });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="dados">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dados">Dados principais</TabsTrigger>
          <TabsTrigger value="familia">Família</TabsTrigger>
          <TabsTrigger value="acessibilidade">Acessibilidade</TabsTrigger>
          <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
          <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
          <TabsTrigger value="marcadores">Marcadores</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="termos">Termos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="bg-card border rounded-xl p-5 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 flex flex-col items-center gap-2">
              <div className="w-32 h-32 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                {v.foto_url ? <img src={v.foto_url} alt="" className="w-full h-full object-cover" /> : <Camera className="w-10 h-10 text-muted-foreground" />}
              </div>
              <Label className="cursor-pointer text-sm text-primary">
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={uploadFoto} />
                Enviar foto
              </Label>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome completo *" full><Input value={v.nome ?? ""} onChange={(e) => set("nome", e.target.value)} /></Field>
              <Field label="Status"><SelectBox value={v.status} onChange={(x) => set("status", x)} options={ATENDIDO_STATUS} /></Field>
              <Field label="Data de nascimento"><Input type="date" value={v.data_nascimento ?? ""} onChange={(e) => set("data_nascimento", e.target.value)} /></Field>
              <Field label="Idade"><Input value={idade != null ? `${idade} anos` : ""} disabled /></Field>
              <Field label="CPF"><Input value={v.cpf ?? ""} onChange={(e) => set("cpf", e.target.value)} /></Field>
              <Field label="RG"><Input value={v.rg ?? ""} onChange={(e) => set("rg", e.target.value)} /></Field>
              <Field label="Telefone"><Input value={v.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} /></Field>
              <Field label="WhatsApp"><Input value={v.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
              <Field label="E-mail"><Input type="email" value={v.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="CEP"><Input value={v.cep ?? ""} onChange={(e) => set("cep", e.target.value)} /></Field>
              <Field label="Cidade"><Input value={v.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} /></Field>
              <Field label="Bairro"><Input value={v.bairro ?? ""} onChange={(e) => set("bairro", e.target.value)} /></Field>
              <Field label="Endereço" full><Input value={v.endereco ?? ""} onChange={(e) => set("endereco", e.target.value)} /></Field>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="familia" className="bg-card border rounded-xl p-5 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nome do responsável"><Input value={v.responsavel_nome ?? ""} onChange={(e) => set("responsavel_nome", e.target.value)} /></Field>
          <Field label="Grau de parentesco"><Input value={v.responsavel_parentesco ?? ""} onChange={(e) => set("responsavel_parentesco", e.target.value)} /></Field>
          <Field label="Telefone do responsável"><Input value={v.responsavel_telefone ?? ""} onChange={(e) => set("responsavel_telefone", e.target.value)} /></Field>
          <Field label="E-mail do responsável"><Input value={v.responsavel_email ?? ""} onChange={(e) => set("responsavel_email", e.target.value)} /></Field>
          <Field label="Matrícula da família"><Input value={v.matricula_familia ?? ""} onChange={(e) => set("matricula_familia", e.target.value)} /></Field>
          <Field label="Pessoas na família"><Input type="number" value={v.numero_pessoas_familia ?? ""} onChange={(e) => set("numero_pessoas_familia", e.target.value)} /></Field>
          <Field label="Observações familiares" full><Textarea rows={3} value={v.observacoes_familiares ?? ""} onChange={(e) => set("observacoes_familiares", e.target.value)} /></Field>
        </TabsContent>

        <TabsContent value="acessibilidade" className="bg-card border rounded-xl p-5 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Pessoa com deficiência?"><SelectBox value={v.pessoa_com_deficiencia} onChange={(x) => set("pessoa_com_deficiencia", x)} options={PCD_OPTIONS} /></Field>
          <Field label="Tipo de deficiência (opcional)"><Input value={v.tipo_deficiencia ?? ""} onChange={(e) => set("tipo_deficiencia", e.target.value)} /></Field>
          <Field label="Necessidade de apoio" full><Textarea rows={2} value={v.necessidade_apoio ?? ""} onChange={(e) => set("necessidade_apoio", e.target.value)} /></Field>
          <CheckField label="Mobilidade reduzida" checked={!!v.mobilidade_reduzida} onChange={(c) => set("mobilidade_reduzida", c)} />
          <CheckField label="Usa cadeira de rodas" checked={!!v.usa_cadeira_rodas} onChange={(c) => set("usa_cadeira_rodas", c)} />
          <CheckField label="Usa comunicação alternativa" checked={!!v.comunicacao_alternativa} onChange={(c) => set("comunicacao_alternativa", c)} />
          <Field label="Restrição de saúde (opcional)" full><Textarea rows={2} value={v.restricao_saude ?? ""} onChange={(e) => set("restricao_saude", e.target.value)} /></Field>
          <Field label="Observações de acessibilidade" full><Textarea rows={2} value={v.observacoes_acessibilidade ?? ""} onChange={(e) => set("observacoes_acessibilidade", e.target.value)} /></Field>
          <p className="md:col-span-2 text-xs text-muted-foreground">Estes dados são opcionais e protegidos. Trate-os de acordo com a LGPD.</p>
        </TabsContent>

        <TabsContent value="vinculos" className="bg-card border rounded-xl p-5 mt-3 space-y-3">
          {vinculos.map((vi, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 border rounded-lg p-3 items-end">
              <Field label="Projeto">
                <SelectBox value={vi.projeto_id} onChange={(x) => { const c = [...vinculos]; c[i].projeto_id = x; setVinculos(c); }} options={projetos.map((p) => ({ value: p.id, label: p.titulo }))} />
              </Field>
              <Field label="Atividade">
                <SelectBox value={vi.atividade_id} onChange={(x) => { const c = [...vinculos]; c[i].atividade_id = x; setVinculos(c); }} options={atividades.map((a) => ({ value: a.id, label: a.titulo }))} />
              </Field>
              <Field label="Grupo / Turma">
                <SelectBox value={vi.grupo_id} onChange={(x) => { const c = [...vinculos]; c[i].grupo_id = x; setVinculos(c); }} options={grupos.map((g) => ({ value: g.id, label: g.nome }))} />
              </Field>
              <Field label="Data de entrada"><Input type="date" value={vi.data_entrada ?? ""} onChange={(e) => { const c = [...vinculos]; c[i].data_entrada = e.target.value; setVinculos(c); }} /></Field>
              <div className="flex items-end gap-2">
                <Field label="Status"><Input value={vi.status ?? "ativo"} onChange={(e) => { const c = [...vinculos]; c[i].status = e.target.value; setVinculos(c); }} /></Field>
                <Button variant="ghost" size="icon" onClick={() => setVinculos(vinculos.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addVinculo}><Plus className="w-4 h-4 mr-1" /> Adicionar vínculo</Button>
        </TabsContent>

        <TabsContent value="atendimento" className="bg-card border rounded-xl p-5 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Situação do atendimento"><SelectBox value={v.status} onChange={(x) => set("status", x)} options={ATENDIDO_STATUS} /></Field>
          <Field label="Próximo retorno"><Input type="date" value={v.proximo_retorno ?? ""} onChange={(e) => set("proximo_retorno", e.target.value)} /></Field>
          <Field label="Demanda inicial" full><Textarea rows={2} value={v.demanda_inicial ?? ""} onChange={(e) => set("demanda_inicial", e.target.value)} /></Field>
          <Field label="Encaminhamento realizado" full><Textarea rows={2} value={v.encaminhamento ?? ""} onChange={(e) => set("encaminhamento", e.target.value)} /></Field>
          <Field label="Observações" full><Textarea rows={3} value={v.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} /></Field>
        </TabsContent>

        <TabsContent value="marcadores" className="bg-card border rounded-xl p-5 mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {marcadores.map((m) => (
              <span key={m} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                {m}
                <button onClick={() => setMarcadores(marcadores.filter((x) => x !== m))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Novo marcador" value={novoMarcador} onChange={(e) => setNovoMarcador(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMarcador(novoMarcador))} />
            <Button type="button" onClick={() => addMarcador(novoMarcador)}><Plus className="w-4 h-4" /></Button>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Sugestões:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {MARCADORES_PADRAO.filter((m) => !marcadores.includes(m)).map((m) => (
                <button key={m} onClick={() => addMarcador(m)} className="text-xs px-2 py-1 border rounded-full hover:bg-accent">+ {m}</button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="bg-card border rounded-xl p-5 mt-3 space-y-3">
          {!id && <p className="text-sm text-muted-foreground">Salve o atendido para anexar documentos.</p>}
          {id && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {TIPO_DOCUMENTO.map((t) => (
                  <Label key={t} className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:border-primary hover:bg-primary/5">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{t}</div>
                    <input type="file" className="hidden" onChange={(e) => uploadDoc(e, t)} />
                  </Label>
                ))}
              </div>
              {documentos.length > 0 && (
                <ul className="divide-y border rounded-lg">
                  {documentos.map((d) => (
                    <li key={d.id} className="px-3 py-2 flex items-center justify-between gap-2">
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-sm hover:underline truncate">
                        <span className="text-xs text-muted-foreground">[{d.tipo}]</span> {d.nome}
                      </a>
                      <Button variant="ghost" size="icon" onClick={() => delDoc(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="termos" className="bg-card border rounded-xl p-5 mt-3 space-y-3">
          <CheckField label="Autorização de uso de imagem" checked={!!v.autorizacao_imagem} onChange={(c) => set("autorizacao_imagem", c)} />
          <CheckField label="Aceite de participação" checked={!!v.aceite_participacao} onChange={(c) => set("aceite_participacao", c)} />
          <Field label="Observações legais" full><Textarea rows={3} value={v.observacoes_legais ?? ""} onChange={(e) => set("observacoes_legais", e.target.value)} /></Field>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 sticky bottom-16 md:bottom-0 bg-background/80 backdrop-blur p-2 -mx-4 px-4">
        <Button variant="outline" onClick={() => nav({ to: "/atendidos" })}>Cancelar</Button>
        <Button onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar atendido"}</Button>
      </div>
    </div>
  );
}

function Field({ label, full, children }: any) {
  return (
    <div className={full ? "sm:col-span-2 md:col-span-3 lg:col-span-3" : ""}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} /> {label}
    </label>
  );
}
function SelectBox({ value, onChange, options }: { value: any; onChange: (v: string) => void; options: ReadonlyArray<{ value: string; label: string }> }) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}
