import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Camera, Download, Image as ImgIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  atividadeId: string;
  canEdit: boolean;
}

export function GaleriaAtividade({ atividadeId, canEdit }: Props) {
  const [fotos, setFotos] = useState<any[]>([]);
  const [encontros, setEncontros] = useState<any[]>([]);
  const [filtroMes, setFiltroMes] = useState<string>("");
  const [filtroEnc, setFiltroEnc] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [{ data: f }, { data: e }] = await Promise.all([
      supabase.from("atividade_fotos").select("*").eq("atividade_id", atividadeId).order("data_foto", { ascending: false }),
      supabase.from("encontros_atividade").select("id, data").eq("atividade_id", atividadeId).order("data"),
    ]);
    setFotos(f ?? []);
    setEncontros(e ?? []);
  }
  useEffect(() => { load(); }, [atividadeId]);

  const filtradas = useMemo(() => {
    return fotos.filter((f) => {
      if (filtroMes && f.data_foto) {
        const m = f.data_foto.slice(0, 7);
        if (m !== filtroMes) return false;
      }
      if (filtroEnc && f.encontro_id !== filtroEnc) return false;
      return true;
    });
  }, [fotos, filtroMes, filtroEnc]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      const path = `${atividadeId}/galeria/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("fotos").upload(path, file);
      if (upErr) { toast.error(upErr.message); continue; }
      const { data: pub } = supabase.storage.from("fotos").getPublicUrl(path);
      await supabase.from("atividade_fotos").insert({
        atividade_id: atividadeId, tipo_foto: "galeria",
        url: pub.publicUrl, data_foto: new Date().toISOString().slice(0, 10),
      });
    }
    setBusy(false);
    e.target.value = "";
    load();
    toast.success("Fotos enviadas.");
  }

  async function del(id: string) {
    if (!confirm("Remover foto?")) return;
    await supabase.from("atividade_fotos").delete().eq("id", id);
    load();
  }

  async function setLegenda(id: string, legenda: string) {
    await supabase.from("atividade_fotos").update({ legenda: legenda || null }).eq("id", id);
  }

  return (
    <div className="bg-card border rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold flex items-center gap-2"><ImgIcon className="w-4 h-4" /> Galeria da atividade</h2>
        {canEdit && (
          <label className="cursor-pointer">
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple capture="environment" hidden onChange={upload} disabled={busy} />
            <Button size="sm" asChild><span><Camera className="w-4 h-4 mr-1" /> Adicionar fotos</span></Button>
          </label>
        )}
      </div>

      <div className="px-4 py-2 border-b flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground">Filtros:</span>
        <Input type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="w-40 h-8 text-sm" />
        <select value={filtroEnc} onChange={(e) => setFiltroEnc(e.target.value)} className="border rounded-md h-8 px-2 text-sm">
          <option value="">Todos os encontros</option>
          {encontros.map((e) => (
            <option key={e.id} value={e.id}>{new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR")}</option>
          ))}
        </select>
        {(filtroMes || filtroEnc) && (
          <Button variant="ghost" size="sm" onClick={() => { setFiltroMes(""); setFiltroEnc(""); }}>Limpar</Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{filtradas.length} foto(s)</span>
      </div>

      <div className="p-4">
        {filtradas.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma foto na galeria.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtradas.map((f) => (
              <div key={f.id} className="border rounded-lg overflow-hidden bg-muted/20">
                <div className="aspect-square relative group">
                  <img src={f.url} alt={f.legenda ?? ""} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    <Button size="icon" variant="secondary" className="h-8 w-8" asChild>
                      <a href={f.url} download target="_blank" rel="noreferrer"><Download className="w-4 h-4" /></a>
                    </Button>
                    {canEdit && (
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => del(f.id)}><Trash2 className="w-4 h-4" /></Button>
                    )}
                  </div>
                </div>
                {canEdit ? (
                  <Input
                    placeholder="Legenda..."
                    defaultValue={f.legenda ?? ""}
                    onBlur={(e) => setLegenda(f.id, e.target.value)}
                    className="h-8 text-xs border-0 rounded-none"
                  />
                ) : (
                  f.legenda && <div className="px-2 py-1 text-xs truncate">{f.legenda}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
