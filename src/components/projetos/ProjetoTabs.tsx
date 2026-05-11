import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { META_STATUS, CRONOGRAMA_STATUS, CATEGORIAS_ORCAMENTO, TIPOS_DOCUMENTO_PROJETO, formatBRL, metaStatusLabel, cronogramaStatusLabel } from "@/lib/projetos";

function useList(table: string, projetoId: string, order = "created_at") {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    const { data } = await supabase.from(table as any).select("*").eq("projeto_id", projetoId).order(order, { ascending: false });
    setRows(data ?? []); setLoading(false);
  }
  useEffect(() => { load(); }, [projetoId]);
  return { rows, loading, reload: load };
}

export function MetasTab({ projetoId }: { projetoId: string }) {
  const { rows, reload } = useList("projeto_metas", projetoId);
  const [n, setN] = useState<any>({ status: "nao_iniciada" });
  async function add() {
    if (!n.nome?.trim()) return toast.error("Informe o nome da meta.");
    const { error } = await supabase.from("projeto_metas").insert({ ...n, projeto_id: projetoId });
    if (error) return toast.error(error.message);
    toast.success("Meta adicionada."); setN({ status: "nao_iniciada" }); reload();
  }
  async function del(id: string) { await supabase.from("projeto_metas").delete().eq("id", id); reload(); }
  async function updateField(id: string, k: string, v: any) {
    await supabase.from("projeto_metas").update({ [k]: v } as any).eq("id", id); reload();
  }
  return (
    <div className="space-y-3">
      <div className="bg-muted/30 rounded-lg p-3 grid grid-cols-1 md:grid-cols-6 gap-2">
        <Input placeholder="Nome da meta *" className="md:col-span-2" value={n.nome ?? ""} onChange={(e) => setN({ ...n, nome: e.target.value })} />
        <Input placeholder="Unidade" value={n.unidade_medida ?? ""} onChange={(e) => setN({ ...n, unidade_medida: e.target.value })} />
        <Input type="number" placeholder="Prevista" value={n.quantidade_prevista ?? ""} onChange={(e) => setN({ ...n, quantidade_prevista: e.target.value })} />
        <Input type="number" placeholder="Realizada" value={n.quantidade_realizada ?? ""} onChange={(e) => setN({ ...n, quantidade_realizada: e.target.value })} />
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground p-4 text-center">Nenhuma meta cadastrada.</p> : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr>
              <th className="p-2 text-left">Meta</th><th className="p-2">Unid.</th><th className="p-2">Prevista</th><th className="p-2">Realizada</th><th className="p-2">Status</th><th></th>
            </tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2"><div className="font-medium">{r.nome}</div>{r.descricao && <div className="text-xs text-muted-foreground">{r.descricao}</div>}</td>
                <td className="p-2">{r.unidade_medida ?? "—"}</td>
                <td className="p-2">{r.quantidade_prevista ?? "—"}</td>
                <td className="p-2"><Input type="number" defaultValue={r.quantidade_realizada ?? 0} className="w-20 h-7" onBlur={(e) => updateField(r.id, "quantidade_realizada", e.target.value)} /></td>
                <td className="p-2">
                  <Select value={r.status} onValueChange={(v) => updateField(r.id, "status", v)}>
                    <SelectTrigger className="w-44 h-7"><SelectValue>{metaStatusLabel(r.status)}</SelectValue></SelectTrigger>
                    <SelectContent>{META_STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="p-2"><Button variant="ghost" size="icon" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function CronogramaTab({ projetoId }: { projetoId: string }) {
  const { rows, reload } = useList("projeto_cronograma", projetoId, "data_inicio");
  const [n, setN] = useState<any>({ status: "planejado" });
  async function add() {
    if (!n.etapa?.trim()) return toast.error("Informe a etapa.");
    const { error } = await supabase.from("projeto_cronograma").insert({ ...n, projeto_id: projetoId });
    if (error) return toast.error(error.message);
    toast.success("Etapa adicionada."); setN({ status: "planejado" }); reload();
  }
  async function del(id: string) { await supabase.from("projeto_cronograma").delete().eq("id", id); reload(); }
  return (
    <div className="space-y-3">
      <div className="bg-muted/30 rounded-lg p-3 grid grid-cols-1 md:grid-cols-6 gap-2">
        <Input placeholder="Etapa *" className="md:col-span-2" value={n.etapa ?? ""} onChange={(e) => setN({ ...n, etapa: e.target.value })} />
        <Input type="date" value={n.data_inicio ?? ""} onChange={(e) => setN({ ...n, data_inicio: e.target.value })} />
        <Input type="date" value={n.data_fim ?? ""} onChange={(e) => setN({ ...n, data_fim: e.target.value })} />
        <Input placeholder="Responsável" value={n.responsavel ?? ""} onChange={(e) => setN({ ...n, responsavel: e.target.value })} />
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground p-4 text-center">Nenhuma etapa cadastrada.</p> : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="p-2 text-left">Etapa</th><th className="p-2">Início</th><th className="p-2">Fim</th><th className="p-2">Responsável</th><th className="p-2">Status</th><th></th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-medium">{r.etapa}</td>
                <td className="p-2">{r.data_inicio ? new Date(r.data_inicio).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="p-2">{r.data_fim ? new Date(r.data_fim).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="p-2">{r.responsavel ?? "—"}</td>
                <td className="p-2">{cronogramaStatusLabel(r.status)}</td>
                <td className="p-2"><Button variant="ghost" size="icon" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function OrcamentoTab({ projetoId }: { projetoId: string }) {
  const { rows, reload } = useList("projeto_orcamento", projetoId, "data_despesa");
  const [n, setN] = useState<any>({});
  const totalPrev = rows.reduce((s, r) => s + Number(r.valor_previsto ?? 0), 0);
  const totalExec = rows.reduce((s, r) => s + Number(r.valor_executado ?? 0), 0);
  async function add() {
    if (!n.descricao?.trim()) return toast.error("Informe a descrição.");
    const { error } = await supabase.from("projeto_orcamento").insert({ ...n, projeto_id: projetoId });
    if (error) return toast.error(error.message);
    toast.success("Lançamento adicionado."); setN({}); reload();
  }
  async function del(id: string) { await supabase.from("projeto_orcamento").delete().eq("id", id); reload(); }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Previsto" v={formatBRL(totalPrev)} />
        <Stat label="Executado" v={formatBRL(totalExec)} />
        <Stat label="Saldo" v={formatBRL(totalPrev - totalExec)} />
      </div>
      <div className="bg-muted/30 rounded-lg p-3 grid grid-cols-1 md:grid-cols-6 gap-2">
        <Select value={n.categoria ?? ""} onValueChange={(v) => setN({ ...n, categoria: v })}>
          <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>{CATEGORIAS_ORCAMENTO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Descrição *" className="md:col-span-2" value={n.descricao ?? ""} onChange={(e) => setN({ ...n, descricao: e.target.value })} />
        <Input type="number" step="0.01" placeholder="Previsto" value={n.valor_previsto ?? ""} onChange={(e) => setN({ ...n, valor_previsto: e.target.value })} />
        <Input type="number" step="0.01" placeholder="Executado" value={n.valor_executado ?? ""} onChange={(e) => setN({ ...n, valor_executado: e.target.value })} />
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground p-4 text-center">Nenhum lançamento.</p> : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="p-2 text-left">Categoria</th><th className="p-2">Descrição</th><th className="p-2">Previsto</th><th className="p-2">Executado</th><th className="p-2">Data</th><th></th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.categoria ?? "—"}</td>
                <td className="p-2">{r.descricao}</td>
                <td className="p-2">{formatBRL(r.valor_previsto)}</td>
                <td className="p-2">{formatBRL(r.valor_executado)}</td>
                <td className="p-2">{r.data_despesa ? new Date(r.data_despesa).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="p-2"><Button variant="ghost" size="icon" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function DocumentosTab({ projetoId }: { projetoId: string }) {
  const { rows, reload } = useList("projeto_documentos", projetoId);
  const [busy, setBusy] = useState(false);
  const [tipo, setTipo] = useState<string>("Outro");
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    const path = `projetos/${projetoId}/${Date.now()}-${f.name}`;
    const { error: upErr } = await supabase.storage.from("fotos").upload(path, f);
    if (upErr) { setBusy(false); return toast.error(upErr.message); }
    const { data: pub } = supabase.storage.from("fotos").getPublicUrl(path);
    const { error } = await supabase.from("projeto_documentos").insert({ projeto_id: projetoId, nome: f.name, tipo, url: pub.publicUrl });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Documento enviado."); reload(); }
    e.target.value = "";
  }
  async function del(id: string) { await supabase.from("projeto_documentos").delete().eq("id", id); reload(); }
  return (
    <div className="space-y-3">
      <div className="bg-muted/30 rounded-lg p-3 flex flex-wrap gap-2 items-center">
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>{TIPOS_DOCUMENTO_PROJETO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <label className="inline-flex items-center px-4 h-10 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90 text-sm">
          <Upload className="w-4 h-4 mr-2" /> {busy ? "Enviando..." : "Enviar arquivo"}
          <input type="file" className="hidden" onChange={upload} disabled={busy} />
        </label>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground p-4 text-center">Nenhum documento.</p> : (
        <ul className="divide-y border rounded-lg">{rows.map((d) => (
          <li key={d.id} className="p-3 flex items-center justify-between gap-2">
            <a href={d.url} target="_blank" rel="noreferrer" className="text-sm hover:text-primary truncate flex-1">
              <span className="text-xs text-muted-foreground mr-2">[{d.tipo}]</span>{d.nome}
            </a>
            <Button variant="ghost" size="icon" onClick={() => del(d.id)}><Trash2 className="w-4 h-4" /></Button>
          </li>
        ))}</ul>
      )}
    </div>
  );
}

export function FotosProjetoTab({ projetoId }: { projetoId: string }) {
  const { rows, reload } = useList("projeto_fotos", projetoId);
  const [busy, setBusy] = useState(false);
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []); if (!files.length) return;
    setBusy(true);
    for (const f of files) {
      const path = `projetos/${projetoId}/fotos/${Date.now()}-${f.name}`;
      const { error: upErr } = await supabase.storage.from("fotos").upload(path, f);
      if (upErr) { toast.error(upErr.message); continue; }
      const { data: pub } = supabase.storage.from("fotos").getPublicUrl(path);
      await supabase.from("projeto_fotos").insert({ projeto_id: projetoId, url: pub.publicUrl, data_foto: new Date().toISOString().slice(0, 10) });
    }
    setBusy(false); toast.success("Fotos enviadas."); reload(); e.target.value = "";
  }
  async function del(id: string) { await supabase.from("projeto_fotos").delete().eq("id", id); reload(); }
  return (
    <div className="space-y-3">
      <div>
        <label className="inline-flex items-center px-4 h-10 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90 text-sm">
          <Upload className="w-4 h-4 mr-2" /> {busy ? "Enviando..." : "Enviar fotos"}
          <input type="file" multiple accept="image/*" className="hidden" onChange={upload} disabled={busy} />
        </label>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground p-4 text-center">Nenhuma foto.</p> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{rows.map((f) => (
          <div key={f.id} className="relative group border rounded-lg overflow-hidden aspect-square">
            <img src={f.url} alt={f.legenda ?? ""} className="w-full h-full object-cover" />
            <button onClick={() => del(f.id)} className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded p-1 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}</div>
      )}
    </div>
  );
}

function Stat({ label, v }: { label: string; v: string | number }) {
  return <div className="bg-muted/40 rounded-lg p-3"><div className="text-[11px] uppercase text-muted-foreground">{label}</div><div className="text-lg font-semibold">{v}</div></div>;
}
