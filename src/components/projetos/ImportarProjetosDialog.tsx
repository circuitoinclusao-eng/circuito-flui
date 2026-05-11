import { useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download } from "lucide-react";

const CAMPOS = [
  { value: "__ignore__", label: "— Ignorar —" },
  { value: "titulo", label: "Nome do projeto *" },
  { value: "id_externo", label: "ID externo" },
  { value: "numero_projeto", label: "Número do projeto" },
  { value: "tipo", label: "Tipo de projeto" },
  { value: "status", label: "Status" },
  { value: "descricao", label: "Descrição" },
  { value: "cidade", label: "Cidade" },
  { value: "territorio", label: "Território" },
  { value: "local_execucao", label: "Local de execução" },
  { value: "publico_alvo", label: "Público-alvo" },
  { value: "atendidos_previstos", label: "Atendidos previstos" },
  { value: "atendidos_realizados", label: "Atendidos realizados" },
  { value: "data_inicio", label: "Data de início" },
  { value: "data_fim", label: "Data de fim" },
  { value: "responsavel_nome", label: "Responsável" },
  { value: "coordenador_nome", label: "Coordenador" },
  { value: "edital_nome", label: "Edital" },
  { value: "orgao_edital", label: "Órgão do edital" },
  { value: "fonte_recurso", label: "Fonte de recurso" },
  { value: "qual_lei_incentivo", label: "Lei de incentivo" },
  { value: "numero_processo", label: "Número do processo" },
  { value: "patrocinador", label: "Patrocinador" },
  { value: "parceiro", label: "Parceiro" },
  { value: "valor_solicitado", label: "Valor solicitado" },
  { value: "valor_aprovado", label: "Valor aprovado" },
  { value: "valor_captado", label: "Valor captado" },
  { value: "valor_executado", label: "Valor executado" },
  { value: "objetivo_geral", label: "Objetivo geral" },
  { value: "objetivos_especificos", label: "Objetivos específicos" },
  { value: "justificativa", label: "Justificativa" },
  { value: "metodologia", label: "Metodologia" },
  { value: "resultados_esperados", label: "Resultados esperados" },
  { value: "indicadores", label: "Indicadores" },
  { value: "situacao_prestacao_contas", label: "Situação prestação de contas" },
  { value: "data_limite_prestacao", label: "Data limite prestação" },
  { value: "observacoes", label: "Observações" },
];

const ALIAS: Record<string, string> = {
  // nome
  nome: "titulo", nome_projeto: "titulo", nome_do_projeto: "titulo", projeto: "titulo", titulo: "titulo",
  // id e numero
  id_projeto: "id_externo", id_externo: "id_externo", id: "id_externo", codigo: "id_externo",
  numero_projeto: "numero_projeto", numero_do_projeto: "numero_projeto", numero: "numero_projeto", n_projeto: "numero_projeto", no_projeto: "numero_projeto",
  // tipo, status
  tipo: "tipo", tipo_projeto: "tipo", tipo_do_projeto: "tipo",
  status: "status", situacao: "status",
  // textos
  descricao: "descricao",
  cidade: "cidade", municipio: "cidade",
  territorio: "territorio", regional: "territorio",
  local_execucao: "local_execucao", local: "local_execucao",
  publico_alvo: "publico_alvo", publico: "publico_alvo",
  // quantidades
  quantidade_prevista_atendidos: "atendidos_previstos", atendidos_previstos: "atendidos_previstos", previstos: "atendidos_previstos",
  quantidade_real_atendidos: "atendidos_realizados", atendidos_realizados: "atendidos_realizados", realizados: "atendidos_realizados",
  // datas
  data_inicio: "data_inicio", data_de_inicio: "data_inicio", inicio: "data_inicio",
  data_fim: "data_fim", data_final: "data_fim", data_termino: "data_fim", termino: "data_fim", fim: "data_fim",
  // pessoas
  responsavel: "responsavel_nome", responsavel_nome: "responsavel_nome", gestor: "responsavel_nome",
  coordenador: "coordenador_nome", coordenador_nome: "coordenador_nome",
  // edital
  edital: "edital_nome", edital_nome: "edital_nome", chamada: "edital_nome", oportunidade: "edital_nome",
  orgao_edital: "orgao_edital", orgao: "orgao_edital",
  fonte_recurso: "fonte_recurso", fonte: "fonte_recurso",
  lei_incentivo: "qual_lei_incentivo", qual_lei_incentivo: "qual_lei_incentivo",
  numero_processo: "numero_processo", processo: "numero_processo",
  patrocinador: "patrocinador", empresa_patrocinadora: "patrocinador", apoiador: "patrocinador",
  parceiro: "parceiro",
  // valores
  valor_solicitado: "valor_solicitado",
  valor_aprovado: "valor_aprovado", valor_do_projeto: "valor_aprovado", orcamento_aprovado: "valor_aprovado",
  valor_captado: "valor_captado",
  valor_executado: "valor_executado",
  // objetivos
  objetivo_geral: "objetivo_geral",
  objetivos_especificos: "objetivos_especificos",
  justificativa: "justificativa",
  metodologia: "metodologia",
  resultados_esperados: "resultados_esperados",
  indicadores: "indicadores",
  // prestacao
  situacao_prestacao_contas: "situacao_prestacao_contas", prestacao_contas: "situacao_prestacao_contas",
  data_limite_prestacao: "data_limite_prestacao",
  observacoes: "observacoes", obs: "observacoes",
};

function norm(s: any) {
  return String(s ?? "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_").replace(/[^\w]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function detectDelimiter(sample: string): string {
  const candidates = [";", ",", "\t", "|"];
  let best = ",", max = 0;
  const lines = sample.split("\n").slice(0, 5);
  for (const c of candidates) {
    const score = Math.max(...lines.map((l) => l.split(c).length - 1));
    if (score > max) { max = score; best = c; }
  }
  return best;
}

function parseCSV(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQ = false;
      else field += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === delim) { cur.push(field); field = ""; }
      else if (ch === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (ch === "\r") { /* skip */ }
      else field += ch;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

function detectHeaderRow(allRows: any[][]): number {
  const max = Math.min(allRows.length, 10);
  let bestIdx = 0, bestScore = -1;
  for (let i = 0; i < max; i++) {
    const row = allRows[i];
    const non = row.filter((c) => String(c ?? "").trim() !== "").length;
    if (non < 2) continue;
    let score = 0;
    for (const c of row) {
      const k = norm(c);
      if (!k) continue;
      if (ALIAS[k]) score += 2;
      else if (k.length > 1 && k.length < 40 && !/^\d+$/.test(k)) score += 0.2;
    }
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return bestIdx;
}

function excelDateToISO(v: any): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  const br = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (br) { const [, d, m, y] = br; const yyyy = y.length === 2 ? `20${y}` : y; return `${yyyy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`; }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (iso) return iso[0];
  const t = Date.parse(s); if (!isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return null;
}

function parseValor(v: any): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function normalizeStatus(v: any): string {
  if (!v) return "em_elaboracao";
  const s = norm(v);
  const map: Record<string, string> = {
    rascunho: "rascunho", em_elaboracao: "em_elaboracao", elaboracao: "em_elaboracao",
    enviado: "enviado", em_analise: "em_analise", analise: "em_analise",
    aprovado: "aprovado", em_execucao: "em_execucao", execucao: "em_execucao",
    suspenso: "suspenso", finalizado: "finalizado",
    em_prestacao_contas: "em_prestacao_contas", prestacao_de_contas: "em_prestacao_contas",
    prestacao_enviada: "prestacao_enviada", encerrado: "encerrado", reprovado: "reprovado", arquivado: "arquivado",
  };
  return map[s] ?? "em_execucao";
}

interface Props { open: boolean; onClose: () => void; onDone: () => void; }

export function ImportarProjetosDialog({ open, onClose, onDone }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<string[]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [rawCsvText, setRawCsvText] = useState<string | null>(null);
  const [delim, setDelim] = useState<string>(";");
  const [sheetName, setSheetName] = useState<string>("");
  const [allRows, setAllRows] = useState<any[][]>([]);
  const [headerRowIdx, setHeaderRowIdx] = useState<number>(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep(1); setFileName(""); setSheets([]); setWorkbook(null); setRawCsvText(null);
    setSheetName(""); setAllRows([]); setHeaderRowIdx(0); setHeaders([]); setRows([]); setMapping({});
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setFileName(f.name);
    const ext = f.name.toLowerCase().split(".").pop();
    try {
      if (ext === "csv" || ext === "txt" || ext === "tsv") {
        const text = await f.text();
        setRawCsvText(text);
        const d = detectDelimiter(text); setDelim(d);
        loadCsv(text, d);
      } else {
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array", cellDates: false });
        setWorkbook(wb); setSheets(wb.SheetNames);
        const sn = wb.SheetNames[0]; setSheetName(sn);
        loadSheet(wb, sn);
      }
      setStep(2);
    } catch {
      toast.error("Não foi possível ler o arquivo.");
    }
    e.target.value = "";
  }

  function applyHeaderRow(all: any[][], idx: number) {
    const h = (all[idx] ?? []).map((x) => String(x ?? "").trim());
    setHeaders(h); setRows(all.slice(idx + 1)); autoMap(h);
  }

  function loadCsv(text: string, d: string) {
    const all = parseCSV(text, d);
    if (!all.length) { toast.error("Arquivo vazio."); return; }
    const idx = detectHeaderRow(all);
    setAllRows(all); setHeaderRowIdx(idx); applyHeaderRow(all, idx);
  }

  function loadSheet(wb: XLSX.WorkBook, sn: string) {
    const ws = wb.Sheets[sn];
    const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "", raw: true });
    const filtered = aoa.filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
    if (!filtered.length) { toast.error("Aba vazia."); return; }
    const idx = detectHeaderRow(filtered);
    setAllRows(filtered); setHeaderRowIdx(idx); applyHeaderRow(filtered, idx);
  }

  function autoMap(h: string[]) {
    const m: Record<number, string> = {};
    h.forEach((col, i) => { m[i] = ALIAS[norm(col)] ?? "__ignore__"; });
    setMapping(m);
  }

  function changeDelim(d: string) { setDelim(d); if (rawCsvText) loadCsv(rawCsvText, d); }
  function changeSheet(sn: string) { setSheetName(sn); if (workbook) loadSheet(workbook, sn); }
  function changeHeaderRow(idx: number) { setHeaderRowIdx(idx); applyHeaderRow(allRows, idx); }

  function buildRecord(r: any[]): any | null {
    const o: any = {};
    headers.forEach((_, i) => {
      const dest = mapping[i];
      if (!dest || dest === "__ignore__") return;
      const raw = r[i];
      if (raw == null || String(raw).trim() === "") return;
      let val: any = String(raw).trim();
      if (dest === "data_inicio" || dest === "data_fim" || dest === "data_limite_prestacao") val = excelDateToISO(raw);
      else if (["valor_solicitado", "valor_aprovado", "valor_captado", "valor_executado"].includes(dest)) val = parseValor(raw);
      else if (dest === "atendidos_previstos" || dest === "atendidos_realizados") { const n = parseInt(String(raw).replace(/\D/g, ""), 10); val = isNaN(n) ? null : n; }
      else if (dest === "status") val = normalizeStatus(val);
      if (val != null && val !== "") o[dest] = val;
    });
    if (!o.titulo) return null;
    if (!o.status) o.status = "em_execucao";
    if (!o.cidade) o.cidade = null;
    return o;
  }

  async function importar() {
    setBusy(true);
    const valid: any[] = [];
    let semNome = 0;
    for (const r of rows) { const o = buildRecord(r); if (!o) { semNome++; continue; } valid.push(o); }
    if (!valid.length) { setBusy(false); toast.error("Nenhum registro válido. Verifique o mapeamento (Nome do projeto é obrigatório)."); return; }

    const comId = valid.filter((o) => o.id_externo);
    const comNum = valid.filter((o) => !o.id_externo && o.numero_projeto);
    const semChave = valid.filter((o) => !o.id_externo && !o.numero_projeto);

    let count = 0, erros = 0;
    if (comId.length) {
      const { data, error } = await supabase.from("projetos").upsert(comId, { onConflict: "id_externo", ignoreDuplicates: false }).select("id");
      if (error) { erros += comId.length; toast.error(`Erro: ${error.message}`); } else count += data?.length ?? 0;
    }
    if (comNum.length) {
      const { data, error } = await supabase.from("projetos").upsert(comNum, { onConflict: "numero_projeto", ignoreDuplicates: false }).select("id");
      if (error) { erros += comNum.length; toast.error(`Erro: ${error.message}`); } else count += data?.length ?? 0;
    }
    if (semChave.length) {
      const { data, error } = await supabase.from("projetos").insert(semChave).select("id");
      if (error) { erros += semChave.length; toast.error(`Erro: ${error.message}`); } else count += data?.length ?? 0;
    }

    setBusy(false);
    const msgs = [`${count} projeto(s) processado(s)`];
    if (semNome) msgs.push(`${semNome} sem nome ignorado(s)`);
    if (erros) msgs.push(`${erros} com erro`);
    toast.success(`Importação concluída. ${msgs.join(" • ")}.`);
    onDone(); reset(); onClose();
  }

  function baixarModelo() {
    const cols = ["id_projeto", "nome_projeto", "numero_projeto", "tipo_projeto", "status", "cidade", "territorio", "responsavel", "edital", "patrocinador", "fonte_recurso", "valor_solicitado", "valor_aprovado", "valor_executado", "data_inicio", "data_fim", "objetivo_geral", "indicadores", "situacao_prestacao_contas", "observacoes"];
    const exemplo = ["P-001", "Inclusão pelo esporte", "2024/001", "Esportivo", "em_execucao", "São Paulo", "Zona Leste", "Maria Silva", "Edital ProAC 2024", "Empresa X", "Lei Rouanet", "150000", "120000", "85000", "01/03/2024", "31/12/2024", "Promover inclusão...", "Nº de atendidos, frequência", "em_elaboracao", ""];
    const ws = XLSX.utils.aoa_to_sheet([cols, exemplo]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projetos");
    XLSX.writeFile(wb, "modelo-projetos.xlsx");
  }

  const totalLinhas = rows.length;
  const validos = rows.filter((r) => buildRecord(r)).length;
  const semNomeCount = totalLinhas - validos;
  const comIdCount = rows.filter((r) => { const o = buildRecord(r); return o && (o.id_externo || o.numero_projeto); }).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Importar projetos por planilha</DialogTitle></DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Envie uma planilha (<b>.xls</b>, <b>.xlsx</b> ou <b>.csv</b>) com os dados dos projetos.
              O sistema fará a leitura, permitirá mapear as colunas e revisar antes de importar.
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center px-4 h-10 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90">
                <Upload className="w-4 h-4 mr-2" /> Selecionar planilha
                <input type="file" accept=".csv,.tsv,.txt,.xls,.xlsx" className="hidden" onChange={handleFile} />
              </label>
              <Button variant="outline" onClick={baixarModelo}><Download className="w-4 h-4 mr-2" /> Baixar modelo</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-sm">Arquivo: <b>{fileName}</b></div>
            <div className="flex flex-wrap gap-3 items-end">
              {sheets.length > 1 && (
                <div>
                  <Label className="text-xs">Aba</Label>
                  <Select value={sheetName} onValueChange={changeSheet}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>{sheets.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {rawCsvText && (
                <div>
                  <Label className="text-xs">Separador</Label>
                  <Select value={delim} onValueChange={changeDelim}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value=";">Ponto e vírgula ;</SelectItem>
                      <SelectItem value=",">Vírgula ,</SelectItem>
                      <SelectItem value={"\t"}>Tabulação</SelectItem>
                      <SelectItem value="|">Barra |</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs">Linha do cabeçalho</Label>
                <Input type="number" min={1} max={Math.min(allRows.length, 20)} value={headerRowIdx + 1}
                  onChange={(e) => changeHeaderRow(Math.max(1, Math.min(allRows.length, parseInt(e.target.value || "1", 10))) - 1)}
                  className="w-32" />
                <p className="text-[11px] text-muted-foreground mt-1">Detectada automaticamente.</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Mapeamento de colunas</h3>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50"><tr>
                    <th className="p-2 text-left">Coluna do arquivo</th><th className="p-2 text-left">Campo do sistema</th><th className="p-2 text-left">Exemplo</th>
                  </tr></thead>
                  <tbody>
                    {headers.map((h, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-mono text-xs">{h || `(coluna ${i + 1})`}</td>
                        <td className="p-2">
                          <Select value={mapping[i] ?? "__ignore__"} onValueChange={(v) => setMapping({ ...mapping, [i]: v })}>
                            <SelectTrigger className="w-64 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>{CAMPOS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs truncate max-w-xs">{String(rows[0]?.[i] ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!Object.values(mapping).includes("titulo") && (
                <p className="text-xs text-destructive mt-2">⚠ Mapeie pelo menos uma coluna como <b>Nome do projeto</b>.</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Linhas" v={totalLinhas} />
              <Stat label="Válidos" v={validos} />
              <Stat label="Com chave (atualiza)" v={comIdCount} />
              <Stat label="Sem nome (ignorados)" v={semNomeCount} />
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Prévia (primeiras 10 linhas de {totalLinhas})</h3>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50"><tr>{headers.map((h, i) => <th key={i} className="p-2 text-left">{h}</th>)}</tr></thead>
                  <tbody>
                    {rows.slice(0, 10).map((r, ri) => (
                      <tr key={ri} className="border-t">{headers.map((_, i) => <td key={i} className="p-2 truncate max-w-xs">{String(r[i] ?? "")}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <>
              <Button variant="ghost" onClick={() => reset()}>Cancelar</Button>
              <Button disabled={busy || !Object.values(mapping).includes("titulo")} onClick={importar}>
                {busy ? "Importando..." : `Importar ${validos} projeto(s)`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{v}</div>
    </div>
  );
}
