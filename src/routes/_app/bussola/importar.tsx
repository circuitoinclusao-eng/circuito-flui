import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as XLSX from "xlsx";
import {
  CAMPOS_PADRAO, type CampoKey, autoMap, consolidar, loadStore, saveStore,
} from "@/lib/bussola";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/bussola/importar")({
  component: BussolaImportar,
});

type Etapa = "upload" | "mapear" | "preview";

function BussolaImportar() {
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<CampoKey, string>>>({});
  const [dedup, setDedup] = useState(true);
  const [preview, setPreview] = useState<{ registros: any[]; alertas: string[] } | null>(null);

  async function onFile(file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });
    if (!json.length) {
      toast.error("Planilha vazia.");
      return;
    }
    const hdrs = Object.keys(json[0]);
    setHeaders(hdrs);
    setRows(json);
    setNomeArquivo(file.name);
    setMapping(autoMap(hdrs));
    setEtapa("mapear");
  }

  function gerarPreview() {
    const obrig = CAMPOS_PADRAO.filter((c) => c.required);
    const faltando = obrig.filter((c) => !mapping[c.key]);
    if (faltando.length) {
      toast.error(`Mapeie os campos obrigatórios: ${faltando.map((c) => c.label).join(", ")}`);
      return;
    }
    const r = consolidar(rows, mapping, nomeArquivo, { dedup });
    setPreview(r);
    setEtapa("preview");
  }

  function confirmar() {
    if (!preview) return;
    const s = loadStore();
    const fonteId = crypto.randomUUID();
    s.fontes.push({
      id: fonteId,
      nome: nomeArquivo,
      tipo: nomeArquivo.toLowerCase().endsWith(".csv") ? "csv" : "xlsx",
      data_importacao: new Date().toISOString(),
      status: preview.alertas.length ? "alerta" : "ok",
      total_linhas: rows.length,
      total_validas: preview.registros.length,
      observacoes: preview.alertas.slice(0, 3).join(" • "),
    });
    s.registros.push(...preview.registros.map((r: any) => ({ ...r, origem_fonte: nomeArquivo })));
    s.logs.unshift({
      id: crypto.randomUUID(),
      data_hora: new Date().toISOString(),
      fonte: nomeArquivo,
      status: preview.alertas.length ? "alerta" : "ok",
      mensagem: `${preview.registros.length}/${rows.length} linhas importadas. ${preview.alertas.length} alerta(s).`,
    });
    saveStore(s);
    toast.success(`Importação concluída: ${preview.registros.length} registros adicionados.`);
    setEtapa("upload");
    setHeaders([]); setRows([]); setMapping({}); setPreview(null); setNomeArquivo("");
  }

  return (
    <div className="grid gap-4">
      <Stepper etapa={etapa} />

      {etapa === "upload" && (
        <Card className="p-8 text-center border-dashed border-2">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-semibold text-lg mb-1">Envie uma planilha do Bússola</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Aceita arquivos <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong>. As colunas serão mapeadas para o modelo padrão.
          </p>
          <label className="inline-block">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg cursor-pointer hover:bg-primary/90 transition">
              <Upload className="w-4 h-4" /> Selecionar arquivo
            </span>
          </label>
        </Card>
      )}

      {etapa === "mapear" && (
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold">Mapeamento de colunas</h2>
              <p className="text-sm text-muted-foreground">
                Arquivo: <strong>{nomeArquivo}</strong> — {rows.length} linhas detectadas.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEtapa("upload")}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mb-5">
            {CAMPOS_PADRAO.map((c) => (
              <div key={c.key}>
                <Label className="text-xs flex items-center gap-1.5">
                  {c.label}
                  {c.required && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={mapping[c.key] ?? "__none__"}
                  onValueChange={(v) => setMapping({ ...mapping, [c.key]: v === "__none__" ? undefined : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhuma coluna" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Nenhuma coluna —</SelectItem>
                    {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={dedup} onCheckedChange={setDedup} />
              Remover duplicidades (mesma pessoa + data + serviço)
            </label>
            <Button onClick={gerarPreview}>Gerar prévia</Button>
          </div>
        </Card>
      )}

      {etapa === "preview" && preview && (
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold">Prévia da consolidação</h2>
              <p className="text-sm text-muted-foreground">
                {preview.registros.length} de {rows.length} linhas validadas.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEtapa("mapear")}>Voltar</Button>
              <Button size="sm" onClick={confirmar}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar importação
              </Button>
            </div>
          </div>

          {preview.alertas.length > 0 && (
            <div className="mb-4 bg-warning/15 border border-warning/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-warning-foreground">
                <AlertTriangle className="w-4 h-4" /> {preview.alertas.length} alerta(s)
              </div>
              <ul className="text-xs space-y-0.5 max-h-32 overflow-y-auto">
                {preview.alertas.slice(0, 20).map((a, i) => <li key={i}>• {a}</li>)}
                {preview.alertas.length > 20 && <li className="opacity-70">… e mais {preview.alertas.length - 20}</li>}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  {["ID", "Pessoa", "Data", "Tipo", "Grau", "Unidade", "Território", "Serviço"].map((h) => (
                    <th key={h} className="text-left px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.registros.slice(0, 10).map((r: any) => (
                  <tr key={r.id_registro} className="border-t">
                    <td className="px-3 py-2 font-mono">{r.id_registro}</td>
                    <td className="px-3 py-2">{r.id_pessoa}</td>
                    <td className="px-3 py-2">{r.data_atendimento}</td>
                    <td className="px-3 py-2">{r.tipo_deficiencia ?? "—"}</td>
                    <td className="px-3 py-2 capitalize">{r.grau}</td>
                    <td className="px-3 py-2">{r.unidade ?? "—"}</td>
                    <td className="px-3 py-2">{r.territorio ?? "—"}</td>
                    <td className="px-3 py-2">{r.servico ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.registros.length > 10 && (
              <div className="text-center text-xs text-muted-foreground py-2 border-t">
                Mostrando 10 de {preview.registros.length}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function Stepper({ etapa }: { etapa: Etapa }) {
  const steps: { k: Etapa; label: string }[] = [
    { k: "upload", label: "1. Upload" },
    { k: "mapear", label: "2. Mapeamento" },
    { k: "preview", label: "3. Prévia & confirmação" },
  ];
  const idx = steps.findIndex((s) => s.k === etapa);
  return (
    <div className="flex gap-2">
      {steps.map((s, i) => (
        <div
          key={s.k}
          className={`flex-1 text-xs px-3 py-2 rounded-md border ${
            i === idx ? "bg-primary text-primary-foreground border-primary" :
            i < idx ? "bg-success/10 text-success border-success/30" :
            "bg-muted text-muted-foreground"
          }`}
        >
          {s.label}
        </div>
      ))}
    </div>
  );
}
