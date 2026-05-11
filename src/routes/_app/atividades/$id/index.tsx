import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/Cards";
import {
  ChevronLeft, ChevronRight, FileDown, Pencil, Camera, Trash2, Plus, Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/atividades/$id/")({
  component: AtividadeDetalhe,
});

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function AtividadeDetalhe() {
  const { id } = Route.useParams();
  const { canEdit } = useAuth();
  const today = new Date();
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [ano, setAno] = useState(today.getFullYear());

  const [ativ, setAtiv] = useState<any>(null);
  const [projeto, setProjeto] = useState<any>(null);
  const [plano, setPlano] = useState<any>(null);
  const [fech, setFech] = useState<any>(null);
  const [fotos, setFotos] = useState<any[]>([]);
  const [presencas, setPresencas] = useState<any[]>([]);

  const [editPlano, setEditPlano] = useState(false);
  const [editFech, setEditFech] = useState(false);
  const [openFotos, setOpenFotos] = useState(false);

  const load = useCallback(async () => {
    const { data: a } = await supabase.from("atividades").select("*").eq("id", id).maybeSingle();
    setAtiv(a);
    if (a?.projeto_id) {
      const { data: p } = await supabase.from("projetos").select("*").eq("id", a.projeto_id).maybeSingle();
      setProjeto(p);
    }
    const [{ data: pl }, { data: fe }, { data: fo }, { data: pr }] = await Promise.all([
      supabase.from("planos_mensais").select("*").eq("atividade_id", id).eq("mes", mes).eq("ano", ano).maybeSingle(),
      supabase.from("fechamentos_mensais").select("*").eq("atividade_id", id).eq("mes", mes).eq("ano", ano).maybeSingle(),
      supabase.from("fotos").select("*").eq("atividade_id", id).eq("mes", mes).eq("ano", ano).order("created_at", { ascending: false }),
      supabase.from("presencas").select("*").eq("atividade_id", id).order("nome_participante"),
    ]);
    setPlano(pl); setFech(fe); setFotos(fo ?? []); setPresencas(pr ?? []);
  }, [id, mes, ano]);

  useEffect(() => { load(); }, [load]);

  function changeMonth(delta: number) {
    let m = mes + delta, a = ano;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    setMes(m); setAno(a);
  }

  if (!ativ) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  const presentes = presencas.filter((p) => p.presente).length;

  function exportCSV() {
    const rows = [
      ["Atividade", ativ.titulo],
      ["Projeto", projeto?.titulo ?? ""],
      ["Período", `${MESES[mes - 1]}/${ano}`],
      ["Status fechamento", fech?.situacao ?? "aberto"],
      ["Encontros", fech?.quantidade_encontros ?? ""],
      ["Atendidos", fech?.total_atendidos ?? ativ.participantes_atendidos ?? ""],
      ["Resumo", fech?.resumo_realizado ?? ""],
    ];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u; a.download = `${ativ.titulo}-${mes}-${ano}.csv`; a.click();
    URL.revokeObjectURL(u);
  }

  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">
        Início › <Link to="/projetos" className="hover:underline">Projetos</Link> ›{" "}
        {projeto && <><Link to="/projetos/$id" params={{ id: projeto.id }} className="hover:underline">{projeto.titulo}</Link> › </>}
        <Link to="/atividades" className="hover:underline">Atividades</Link> › {ativ.titulo}
      </nav>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">
            Detalhe de {ativ.titulo}{projeto && ` — ${projeto.titulo}`}
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            {ativ.tipo && <>{ativ.tipo} • </>}{ativ.local ?? "Local não informado"}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCSV}><FileDown className="w-4 h-4 mr-1" /> Exportar CSV</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><FileDown className="w-4 h-4 mr-1" /> Gerar PDF</Button>
          {canEdit && <Button asChild size="sm" variant="outline"><Link to="/atividades/$id/editar" params={{ id }}><Pencil className="w-4 h-4 mr-1" /> Editar dados</Link></Button>}
        </div>
      </div>

      {/* Controle de mês */}
      <div className="bg-card border rounded-xl shadow-sm p-3 mb-4 flex items-center justify-center gap-4">
        <Button size="icon" variant="ghost" onClick={() => changeMonth(-1)}><ChevronLeft className="w-5 h-5" /></Button>
        <div className="font-semibold text-lg min-w-[180px] text-center">{MESES[mes - 1]} / {ano}</div>
        <Button size="icon" variant="ghost" onClick={() => changeMonth(1)}><ChevronRight className="w-5 h-5" /></Button>
      </div>

      {/* Situação do mês */}
      <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between flex-wrap gap-3
        ${fech?.situacao === "fechado" ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/40"}`}>
        <div>
          <div className="text-xs uppercase tracking-wide font-medium opacity-70">Situação do mês</div>
          <div className="font-semibold">
            {fech?.situacao === "fechado"
              ? "Fechado — Relatório mensal concluído"
              : "Aberto — Fechamento mensal não realizado"}
          </div>
        </div>
        {canEdit && <Button size="sm" onClick={() => setEditFech(true)}>Editar fechamento</Button>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plano de aulas */}
        <div className="lg:col-span-2 bg-card border rounded-xl shadow-sm">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold">Plano de aulas — {MESES[mes - 1]}/{ano}</h2>
            {canEdit && <Button size="sm" variant="outline" onClick={() => setEditPlano(true)}><Pencil className="w-4 h-4 mr-1" /> Editar plano</Button>}
          </div>
          <div className="p-5 min-h-[180px]">
            {plano?.plano ? (
              <div className="text-sm whitespace-pre-wrap">{plano.plano}</div>
            ) : (
              <div className="text-sm text-muted-foreground italic">Plano não informado</div>
            )}
          </div>
        </div>

        {/* Dados */}
        <div className="bg-card border rounded-xl shadow-sm p-5 space-y-3 text-sm">
          <h2 className="font-semibold mb-2">Dados da atividade</h2>
          <Row k="Tipo" v={ativ.tipo} />
          <Row k="Data" v={ativ.data ? new Date(ativ.data).toLocaleDateString("pt-BR") : "—"} />
          <Row k="Horário" v={ativ.horario_inicio ? `${ativ.horario_inicio} - ${ativ.horario_fim ?? ""}` : "—"} />
          <Row k="Local" v={ativ.local} />
          <Row k="Prevista" v={ativ.participantes_previstos ?? 0} />
          <Row k="Realizada" v={ativ.participantes_atendidos ?? 0} />
          <Row k="Status" v={<StatusBadge status={ativ.status} />} />
        </div>
      </div>

      {/* Fotos */}
      <div className="mt-6 bg-card border rounded-xl shadow-sm">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Camera className="w-4 h-4" /> Fotos da atividade — {MESES[mes - 1]}/{ano}</h2>
          {canEdit && <Button size="sm" onClick={() => setOpenFotos(true)}>Gerenciar fotos</Button>}
        </div>
        <div className="p-5">
          {fotos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma foto cadastrada para este mês.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {fotos.map((f) => (
                <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="block group">
                  <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                    <img src={f.url} alt={f.legenda ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  {f.legenda && <div className="text-xs mt-1 truncate">{f.legenda}</div>}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Presença */}
      <div className="mt-6 bg-card border rounded-xl shadow-sm">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Lista de presença</h2>
          <div className="text-sm text-muted-foreground">{presentes} presente{presentes !== 1 ? "s" : ""} de {presencas.length}</div>
        </div>
        <PresencaList atividadeId={id} canEdit={canEdit} presencas={presencas} reload={load} />
      </div>

      {/* Dialogs */}
      <PlanoDialog open={editPlano} onClose={() => setEditPlano(false)} atividadeId={id} mes={mes} ano={ano} plano={plano} reload={load} />
      <FechamentoDialog open={editFech} onClose={() => setEditFech(false)} atividadeId={id} mes={mes} ano={ano} fech={fech} reload={load} />
      <FotosDialog open={openFotos} onClose={() => setOpenFotos(false)} atividadeId={id} mes={mes} ano={ano} fotos={fotos} reload={load} />
    </>
  );
}

function Row({ k, v }: any) {
  return (
    <div className="flex items-start justify-between gap-3 border-b last:border-0 pb-2 last:pb-0">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">{k}</span>
      <span className="text-right">{v ?? "—"}</span>
    </div>
  );
}

function PresencaList({ atividadeId, canEdit, presencas, reload }: any) {
  const [novo, setNovo] = useState("");

  async function add() {
    if (!novo.trim()) return;
    const { error } = await supabase.from("presencas").insert({ atividade_id: atividadeId, nome_participante: novo, presente: false });
    if (error) toast.error(error.message);
    else { setNovo(""); reload(); }
  }
  async function toggle(p: any) {
    const { error } = await supabase.from("presencas").update({ presente: !p.presente }).eq("id", p.id);
    if (error) toast.error(error.message); else reload();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("presencas").delete().eq("id", id);
    if (error) toast.error(error.message); else reload();
  }
  async function obs(id: string, observacao: string) {
    await supabase.from("presencas").update({ observacao }).eq("id", id);
  }

  return (
    <div className="p-5">
      {canEdit && (
        <div className="flex gap-2 mb-4">
          <Input placeholder="Adicionar participante..." value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
          <Button onClick={add}><Plus className="w-4 h-4" /></Button>
        </div>
      )}
      {presencas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem participantes cadastrados.</p>
      ) : (
        <ul className="divide-y">
          {presencas.map((p: any) => (
            <li key={p.id} className="py-2 flex items-center gap-3 flex-wrap">
              <Checkbox checked={p.presente} onCheckedChange={() => canEdit && toggle(p)} disabled={!canEdit} />
              <span className="font-medium flex-1 min-w-[150px]">{p.nome_participante}</span>
              <Input className="max-w-xs h-8" placeholder="Observação" defaultValue={p.observacao ?? ""} onBlur={(e) => canEdit && obs(p.id, e.target.value)} disabled={!canEdit} />
              {canEdit && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlanoDialog({ open, onClose, atividadeId, mes, ano, plano, reload }: any) {
  const [text, setText] = useState("");
  useEffect(() => { setText(plano?.plano ?? ""); }, [plano, open]);

  async function save() {
    if (plano?.id) {
      await supabase.from("planos_mensais").update({ plano: text, updated_at: new Date().toISOString() }).eq("id", plano.id);
    } else {
      await supabase.from("planos_mensais").insert({ atividade_id: atividadeId, mes, ano, plano: text });
    }
    toast.success("Plano salvo."); reload(); onClose();
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Plano de aulas — {mes}/{ano}</DialogTitle></DialogHeader>
        <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Descreva o plano do mês..." />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar plano</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FechamentoDialog({ open, onClose, atividadeId, mes, ano, fech, reload }: any) {
  const [v, setV] = useState<any>({});
  useEffect(() => { setV(fech ?? { situacao: "aberto" }); }, [fech, open]);

  async function save() {
    const payload = { ...v, atividade_id: atividadeId, mes, ano };
    if (payload.quantidade_encontros) payload.quantidade_encontros = Number(payload.quantidade_encontros);
    if (payload.total_atendidos) payload.total_atendidos = Number(payload.total_atendidos);
    if (payload.situacao === "fechado" && !payload.data_fechamento) payload.data_fechamento = new Date().toISOString().slice(0, 10);
    let error;
    if (fech?.id) ({ error } = await supabase.from("fechamentos_mensais").update(payload).eq("id", fech.id));
    else ({ error } = await supabase.from("fechamentos_mensais").insert(payload));
    if (error) toast.error(error.message);
    else { toast.success("Fechamento salvo."); reload(); onClose(); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Fechamento mensal — {mes}/{ano}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Situação</Label>
            <Select value={v.situacao ?? "aberto"} onValueChange={(val) => setV({ ...v, situacao: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Encontros</Label><Input type="number" value={v.quantidade_encontros ?? ""} onChange={(e) => setV({ ...v, quantidade_encontros: e.target.value })} /></div>
            <div><Label>Total atendidos</Label><Input type="number" value={v.total_atendidos ?? ""} onChange={(e) => setV({ ...v, total_atendidos: e.target.value })} /></div>
          </div>
          <div><Label>O que foi realizado</Label><Textarea rows={3} value={v.resumo_realizado ?? ""} onChange={(e) => setV({ ...v, resumo_realizado: e.target.value })} /></div>
          <div><Label>Resultados alcançados</Label><Textarea rows={2} value={v.resultados ?? ""} onChange={(e) => setV({ ...v, resultados: e.target.value })} /></div>
          <div><Label>Dificuldades</Label><Textarea rows={2} value={v.dificuldades ?? ""} onChange={(e) => setV({ ...v, dificuldades: e.target.value })} /></div>
          <div><Label>Encaminhamentos</Label><Textarea rows={2} value={v.encaminhamentos ?? ""} onChange={(e) => setV({ ...v, encaminhamentos: e.target.value })} /></div>
          <div><Label>Depoimentos</Label><Textarea rows={2} value={v.depoimentos ?? ""} onChange={(e) => setV({ ...v, depoimentos: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar fechamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FotosDialog({ open, onClose, atividadeId, mes, ano, fotos, reload }: any) {
  const [busy, setBusy] = useState(false);
  const [legenda, setLegenda] = useState("");

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      const path = `${atividadeId}/${ano}-${mes}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
      if (upErr) { toast.error(upErr.message); continue; }
      const { data: pub } = supabase.storage.from("fotos").getPublicUrl(path);
      await supabase.from("fotos").insert({
        atividade_id: atividadeId, mes, ano, url: pub.publicUrl,
        legenda: legenda || null, data_foto: new Date().toISOString().slice(0, 10),
      });
    }
    setBusy(false); setLegenda(""); reload();
    toast.success("Fotos enviadas.");
  }
  async function del(f: any) {
    await supabase.from("fotos").delete().eq("id", f.id);
    reload();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Fotos — {mes}/{ano}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Legenda (opcional, aplicada às próximas fotos enviadas)" value={legenda} onChange={(e) => setLegenda(e.target.value)} />
          <Input type="file" accept="image/*" capture="environment" multiple disabled={busy} onChange={upload} />
          {busy && <p className="text-sm text-muted-foreground">Enviando...</p>}
          {fotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {fotos.map((f: any) => (
                <div key={f.id} className="relative group">
                  <img src={f.url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                  <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => del(f)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter><Button onClick={onClose}>Concluir</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
