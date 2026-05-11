import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ENCONTRO_STATUS, PERIODOS } from "@/lib/atividades";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  atividadeId: string;
  encontro: any | null;
  controlePresenca: boolean;
  reload: () => void;
}

export function RegistrarEncontroDialog({ open, onClose, atividadeId, encontro, controlePresenca, reload }: Props) {
  const [v, setV] = useState<any>({});
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [presencas, setPresencas] = useState<Record<string, { presente: boolean; observacao: string }>>({});
  const [fotos, setFotos] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setV(encontro ?? { status: "nao_registrada", data: new Date().toISOString().slice(0, 10) });
    if (encontro?.id) {
      loadDetalhes(encontro.id);
    } else {
      setPresencas({});
      setFotos([]);
      if (controlePresenca) loadInscritosOnly();
    }
  }, [encontro, open]);

  async function loadInscritosOnly() {
    const { data: ins } = await supabase
      .from("atividade_inscritos")
      .select("atendido_id, atendidos(id,nome,foto_url)")
      .eq("atividade_id", atividadeId)
      .eq("status", "inscrito");
    setInscritos(ins ?? []);
  }

  async function loadDetalhes(encId: string) {
    const [{ data: ins }, { data: pr }, { data: fo }] = await Promise.all([
      supabase.from("atividade_inscritos").select("atendido_id, atendidos(id,nome,foto_url)").eq("atividade_id", atividadeId).eq("status", "inscrito"),
      supabase.from("presencas_atividade").select("*").eq("encontro_id", encId),
      supabase.from("atividade_fotos").select("*").eq("encontro_id", encId).order("ordem"),
    ]);
    setInscritos(ins ?? []);
    const map: Record<string, { presente: boolean; observacao: string }> = {};
    (pr ?? []).forEach((p: any) => { map[p.atendido_id] = { presente: p.presente, observacao: p.observacao ?? "" }; });
    setPresencas(map);
    setFotos(fo ?? []);
  }

  async function save() {
    setBusy(true);
    const payload: any = {
      atividade_id: atividadeId,
      data: v.data,
      horario_inicio: v.horario_inicio || null,
      horario_fim: v.horario_fim || null,
      periodo: v.periodo || null,
      status: v.status,
      resumo: v.resumo || null,
      numero_presentes: Object.values(presencas).filter((x) => x.presente).length || Number(v.numero_presentes) || 0,
      observacoes: v.observacoes || null,
    };
    let encId = encontro?.id;
    if (encId) {
      const { error } = await supabase.from("encontros_atividade").update(payload).eq("id", encId);
      if (error) { toast.error(error.message); setBusy(false); return; }
    } else {
      const { data, error } = await supabase.from("encontros_atividade").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setBusy(false); return; }
      encId = data.id;
    }
    if (controlePresenca && encId) {
      await supabase.from("presencas_atividade").delete().eq("encontro_id", encId);
      const linhas = Object.entries(presencas).map(([atendido_id, { presente, observacao }]) => ({
        encontro_id: encId, atendido_id, presente, observacao: observacao || null,
      }));
      if (linhas.length) await supabase.from("presencas_atividade").insert(linhas);
    }
    setBusy(false);
    toast.success("Encontro salvo.");
    reload();
    onClose();
  }

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !encontro?.id) {
      if (!encontro?.id) toast.error("Salve o encontro antes de enviar fotos.");
      return;
    }
    setBusy(true);
    for (const file of Array.from(files)) {
      const path = `${atividadeId}/encontro-${encontro.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
      if (upErr) { toast.error(upErr.message); continue; }
      const { data: pub } = supabase.storage.from("fotos").getPublicUrl(path);
      await supabase.from("atividade_fotos").insert({
        atividade_id: atividadeId,
        encontro_id: encontro.id,
        tipo_foto: "encontro",
        url: pub.publicUrl,
        data_foto: v.data,
      });
    }
    setBusy(false);
    loadDetalhes(encontro.id);
    toast.success("Fotos enviadas.");
  }

  async function delFoto(id: string) {
    await supabase.from("atividade_fotos").delete().eq("id", id);
    if (encontro?.id) loadDetalhes(encontro.id);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{encontro?.id ? "Registrar encontro" : "Novo encontro"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={v.status} onValueChange={(val) => setV({ ...v, status: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENCONTRO_STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={v.data ?? ""} onChange={(e) => setV({ ...v, data: e.target.value })} />
            </div>
            <div>
              <Label>Horário início</Label>
              <Input type="time" value={v.horario_inicio ?? ""} onChange={(e) => setV({ ...v, horario_inicio: e.target.value })} />
            </div>
            <div>
              <Label>Horário fim</Label>
              <Input type="time" value={v.horario_fim ?? ""} onChange={(e) => setV({ ...v, horario_fim: e.target.value })} />
            </div>
            <div>
              <Label>Período</Label>
              <Select value={v.periodo ?? ""} onValueChange={(val) => setV({ ...v, periodo: val })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {PERIODOS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!controlePresenca && (
              <div>
                <Label>Número de presentes</Label>
                <Input type="number" value={v.numero_presentes ?? ""} onChange={(e) => setV({ ...v, numero_presentes: e.target.value })} />
              </div>
            )}
          </div>

          <div>
            <Label>Resumo do que aconteceu</Label>
            <Textarea rows={3} value={v.resumo ?? ""} onChange={(e) => setV({ ...v, resumo: e.target.value })} />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea rows={2} value={v.observacoes ?? ""} onChange={(e) => setV({ ...v, observacoes: e.target.value })} />
          </div>

          {controlePresenca && inscritos.length > 0 && (
            <div className="border rounded-lg">
              <div className="px-3 py-2 border-b bg-muted/50 text-sm font-medium flex justify-between">
                <span>Chamada ({inscritos.length} inscritos)</span>
                <span className="text-primary">{Object.values(presencas).filter((x) => x.presente).length} presentes</span>
              </div>
              <ul className="divide-y max-h-64 overflow-y-auto">
                {inscritos.map((i) => {
                  const at = i.atendidos;
                  const p = presencas[i.atendido_id] ?? { presente: false, observacao: "" };
                  return (
                    <li key={i.atendido_id} className="px-3 py-2 flex items-center gap-2">
                      <Checkbox
                        checked={p.presente}
                        onCheckedChange={(c) => setPresencas({ ...presencas, [i.atendido_id]: { ...p, presente: !!c } })}
                      />
                      <span className="flex-1 text-sm">{at?.nome}</span>
                      <Input
                        className="max-w-[200px] h-8"
                        placeholder="Obs."
                        value={p.observacao}
                        onChange={(e) => setPresencas({ ...presencas, [i.atendido_id]: { ...p, observacao: e.target.value } })}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div>
            <Label>Fotos do encontro</Label>
            {encontro?.id ? (
              <>
                <Input type="file" accept="image/*" multiple capture="environment" onChange={uploadFoto} disabled={busy} className="mt-1" />
                {fotos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                    {fotos.map((f) => (
                      <div key={f.id} className="relative group">
                        <img src={f.url} alt="" className="w-full aspect-square object-cover rounded" />
                        <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => delFoto(f.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Upload className="w-3 h-3" /> Salve o encontro primeiro para enviar fotos.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar encontro"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
