import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, X, Camera } from "lucide-react";
import { toast } from "sonner";

interface Props {
  atividadeId: string;
  fotoUrl?: string | null;
  legenda?: string | null;
  canEdit: boolean;
  onChange: (url: string | null, legenda: string | null) => void;
}

export function CapaUpload({ atividadeId, fotoUrl, legenda, canEdit, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [leg, setLeg] = useState(legenda ?? "");
  const ref = useRef<HTMLInputElement>(null);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const path = `${atividadeId}/capa-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("fotos").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setBusy(false); return; }
    const { data: pub } = supabase.storage.from("fotos").getPublicUrl(path);
    await supabase.from("atividades").update({ foto_capa_url: pub.publicUrl, foto_capa_legenda: leg || null }).eq("id", atividadeId);
    onChange(pub.publicUrl, leg || null);
    setBusy(false);
    toast.success("Capa atualizada.");
    if (ref.current) ref.current.value = "";
  }

  async function remove() {
    if (!confirm("Remover foto de capa?")) return;
    await supabase.from("atividades").update({ foto_capa_url: null, foto_capa_legenda: null }).eq("id", atividadeId);
    onChange(null, null);
    setLeg("");
  }

  async function saveLegenda() {
    await supabase.from("atividades").update({ foto_capa_legenda: leg || null }).eq("id", atividadeId);
    onChange(fotoUrl ?? null, leg || null);
  }

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <div className="aspect-[3/1] md:aspect-[4/1] bg-muted relative">
        {fotoUrl ? (
          <img src={fotoUrl} alt="Capa da atividade" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <ImagePlus className="w-10 h-10 mb-2 opacity-40" />
            <span className="text-sm">Sem foto de capa</span>
          </div>
        )}
        {canEdit && fotoUrl && (
          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={remove}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {canEdit && (
        <div className="p-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center border-t">
          <Input ref={ref} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" capture="environment" onChange={upload} disabled={busy} className="max-w-xs" />
          <Input placeholder="Legenda da capa (opcional)" value={leg} onChange={(e) => setLeg(e.target.value)} onBlur={saveLegenda} className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => ref.current?.click()}><Camera className="w-4 h-4 mr-1" /> Trocar</Button>
        </div>
      )}
    </div>
  );
}
