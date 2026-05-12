import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FileText } from "lucide-react";

interface Props { open: boolean; onClose: () => void; atividadeId: string; }

export function RelatorioMensalDialog({ open, onClose, atividadeId }: Props) {
  const nav = useNavigate();
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [incInsc, setIncInsc] = useState(true);
  const [incFotos, setIncFotos] = useState(true);
  const [incNaoReg, setIncNaoReg] = useState(false);

  function gerar() {
    nav({
      to: "/atividades/$id/relatorio-mensal",
      params: { id: atividadeId },
      search: { mes, ano, inscritos: incInsc ? 1 : 0, fotos: incFotos ? 1 : 0, naoRegistrados: incNaoReg ? 1 : 0 },
    } as any);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Relatório mensal da atividade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mês</Label>
              <Input type="number" min={1} max={12} value={mes} onChange={(e) => setMes(Number(e.target.value))} />
            </div>
            <div>
              <Label>Ano</Label>
              <Input type="number" min={2000} max={2100} value={ano} onChange={(e) => setAno(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-3 pt-2 border-t">
            <Opt label="Incluir lista de inscritos" v={incInsc} on={setIncInsc} />
            <Opt label="Incluir galeria de fotos" v={incFotos} on={setIncFotos} />
            <Opt label="Incluir encontros não registrados" v={incNaoReg} on={setIncNaoReg} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={gerar}>Gerar PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Opt({ label, v, on }: { label: string; v: boolean; on: (b: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={v} onCheckedChange={on} />
    </div>
  );
}
