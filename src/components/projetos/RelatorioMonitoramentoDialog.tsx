import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  projetoId: string;
  projetoNome: string;
}

export function RelatorioMonitoramentoDialog({ open, onClose, projetoId, projetoNome }: Props) {
  const nav = useNavigate();
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const [inicio, setInicio] = useState(primeiroDia);
  const [fim, setFim] = useState(hoje.toISOString().slice(0, 10));
  const [atividades, setAtividades] = useState(true);
  const [atendidos, setAtendidos] = useState(true);
  const [frequencia, setFrequencia] = useState(true);
  const [fotos, setFotos] = useState(true);
  const [metas, setMetas] = useState(true);
  const [pendencias, setPendencias] = useState(true);
  const [resumo, setResumo] = useState("");

  useEffect(() => {
    if (!open) return;
    setResumo(`No período selecionado, o projeto ${projetoNome} realizou ações de acompanhamento, registrou atividades, atendidos e encontros no sistema. As informações abaixo consolidam os dados disponíveis para monitoramento.`);
  }, [open, projetoNome]);

  function gerar() {
    nav({
      to: "/projetos/$id/relatorio-monitoramento",
      params: { id: projetoId },
      search: {
        inicio,
        fim,
        atividades: atividades ? 1 : 0,
        atendidos: atendidos ? 1 : 0,
        frequencia: frequencia ? 1 : 0,
        fotos: fotos ? 1 : 0,
        metas: metas ? 1 : 0,
        pendencias: pendencias ? 1 : 0,
        resumo,
      },
    } as any);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Relatório de monitoramento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Data inicial</Label>
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div>
              <Label>Data final</Label>
              <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-3">
            <Opt label="Incluir atividades" v={atividades} on={setAtividades} />
            <Opt label="Incluir atendidos" v={atendidos} on={setAtendidos} />
            <Opt label="Incluir frequência" v={frequencia} on={setFrequencia} />
            <Opt label="Incluir fotos" v={fotos} on={setFotos} />
            <Opt label="Incluir metas" v={metas} on={setMetas} />
            <Opt label="Incluir pendências" v={pendencias} on={setPendencias} />
          </div>
          <div>
            <Label>Resumo executivo</Label>
            <Textarea rows={5} value={resumo} onChange={(e) => setResumo(e.target.value)} />
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Switch checked={v} onCheckedChange={on} />
    </div>
  );
}
