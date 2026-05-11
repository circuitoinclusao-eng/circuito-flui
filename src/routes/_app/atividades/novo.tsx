import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { atividadeStatus } from "@/lib/schemas";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/atividades/novo")({
  component: NovaAtividade,
});

function NovaAtividade() {
  const [projetos, setProjetos] = useState<any[]>([]);
  const [v, setV] = useState<any>({ status: "planejada" });
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    supabase.from("projetos").select("id,titulo").order("titulo").then(({ data }) => setProjetos(data ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = { ...v };
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
    if (payload.participantes_previstos) payload.participantes_previstos = Number(payload.participantes_previstos);
    if (payload.participantes_atendidos) payload.participantes_atendidos = Number(payload.participantes_atendidos);
    const { data, error } = await supabase.from("atividades").insert(payload).select("id").single();
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Atividade criada."); nav({ to: "/atividades/$id", params: { id: data.id } }); }
  }

  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">Início › Atividades › Nova</nav>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Nova atividade</h1>
      <form onSubmit={submit} className="bg-card border rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Nome da atividade *</Label>
            <Input required value={v.titulo ?? ""} onChange={(e) => setV({ ...v, titulo: e.target.value })} />
          </div>
          <div>
            <Label>Projeto vinculado</Label>
            <Select value={v.projeto_id ?? ""} onValueChange={(val) => setV({ ...v, projeto_id: val })}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Tipo</Label><Input value={v.tipo ?? ""} onChange={(e) => setV({ ...v, tipo: e.target.value })} /></div>
          <div><Label>Data</Label><Input type="date" value={v.data ?? ""} onChange={(e) => setV({ ...v, data: e.target.value })} /></div>
          <div><Label>Status</Label>
            <Select value={v.status} onValueChange={(val) => setV({ ...v, status: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {atividadeStatus.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Horário início</Label><Input type="time" value={v.horario_inicio ?? ""} onChange={(e) => setV({ ...v, horario_inicio: e.target.value })} /></div>
          <div><Label>Horário fim</Label><Input type="time" value={v.horario_fim ?? ""} onChange={(e) => setV({ ...v, horario_fim: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Local</Label><Input value={v.local ?? ""} onChange={(e) => setV({ ...v, local: e.target.value })} /></div>
          <div><Label>Quantidade prevista</Label><Input type="number" value={v.participantes_previstos ?? ""} onChange={(e) => setV({ ...v, participantes_previstos: e.target.value })} /></div>
          <div><Label>Atendidos</Label><Input type="number" value={v.participantes_atendidos ?? ""} onChange={(e) => setV({ ...v, participantes_atendidos: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Observações</Label><Textarea rows={3} value={v.observacoes ?? ""} onChange={(e) => setV({ ...v, observacoes: e.target.value })} /></div>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
          <Button type="button" variant="outline" onClick={() => nav({ to: "/atividades" })}>Cancelar</Button>
        </div>
      </form>
    </>
  );
}
