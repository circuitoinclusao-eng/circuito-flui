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

const CAMPOS_DESTINO = [
  { value: "__ignore__", label: "— Ignorar —" },
  { value: "nome", label: "Nome" },
  { value: "id_externo", label: "ID externo / código origem" },
  { value: "matricula_familia", label: "Matrícula família" },
  { value: "data_nascimento", label: "Data de nascimento" },
  { value: "idade_importada", label: "Idade importada" },
  { value: "cpf", label: "CPF" },
  { value: "rg", label: "RG" },
  { value: "telefone", label: "Telefone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "cidade", label: "Cidade" },
  { value: "bairro", label: "Bairro" },
  { value: "endereco", label: "Endereço" },
  { value: "cep", label: "CEP" },
  { value: "genero", label: "Gênero" },
  { value: "escolaridade", label: "Escolaridade" },
  { value: "pessoa_com_deficiencia", label: "Pessoa com deficiência" },
  { value: "tipo_deficiencia", label: "Tipo de deficiência" },
  { value: "responsavel_nome", label: "Nome do responsável" },
  { value: "responsavel_telefone", label: "Telefone do responsável" },
  { value: "responsavel_parentesco", label: "Parentesco do responsável" },
  { value: "status", label: "Status" },
  { value: "observacoes", label: "Observações" },
];

const ALIAS: Record<string, string> = {
  nome: "nome", nome_completo: "nome", participante: "nome",
  nome_civil: "nome", nome_social: "nome",
  id_atendido: "id_externo", id: "id_externo", codigo: "id_externo", codigo_origem: "id_externo", id_externo: "id_externo",
  matricula: "matricula_familia", matricula_familia: "matricula_familia", matricula_da_familia: "matricula_familia",
  idade: "idade_importada", idade_importada: "idade_importada",
  data_nascimento: "data_nascimento", data_de_nascimento: "data_nascimento", nascimento: "data_nascimento", dt_nascimento: "data_nascimento",
  cpf: "cpf", rg: "rg",
  telefone: "telefone", celular: "telefone", fone: "telefone",
  whatsapp: "whatsapp", zap: "whatsapp",
  email: "email", "e_mail": "email",
  cidade: "cidade", municipio: "cidade",
  bairro: "bairro", endereco: "endereco", logradouro: "endereco", cep: "cep",
  genero: "genero", sexo: "genero",
  escolaridade: "escolaridade",
  pessoa_com_deficiencia: "pessoa_com_deficiencia", pcd: "pessoa_com_deficiencia",
  tipo_deficiencia: "tipo_deficiencia", deficiencia: "tipo_deficiencia",
  responsavel: "responsavel_nome", nome_responsavel: "responsavel_nome", nome_do_responsavel: "responsavel_nome", responsavel_nome: "responsavel_nome",
  telefone_responsavel: "responsavel_telefone", telefone_do_responsavel: "responsavel_telefone",
  parentesco: "responsavel_parentesco", responsavel_parentesco: "responsavel_parentesco",
  status: "status", situacao: "status", status_atendimento: "status",
  observacoes: "observacoes", obs: "observacoes",
};

function norm(s: string) {
  return String(s ?? "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^\w]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function detectDelimiter(sample: string): string {
  const candidates = [";", ",", "\t", "|"];
  let best = ",", max = 0;
  const firstLines = sample.split("\n").slice(0, 5);
  for (const c of candidates) {
    const counts = firstLines.map((l) => l.split(c).length - 1);
    const score = Math.max(...counts);
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

// Detect which row is the real header: prefer the row with the most ALIAS hits.
// Skip title rows (e.g. "Dados pessoais") that are merged across the columns
// or that have only one filled cell.
function detectHeaderRow(allRows: any[][]): number {
  const maxScan = Math.min(allRows.length, 15);
  let bestIdx = -1, bestAlias = 0, bestScore = -1;
  for (let i = 0; i < maxScan; i++) {
    const row = allRows[i] ?? [];
    const filled = row.map((c) => String(c ?? "").trim()).filter((c) => c !== "");
    if (filled.length < 2) continue;
    // Skip title-like rows where every filled cell is identical (merged title).
    const uniq = new Set(filled.map((c) => c.toLowerCase()));
    if (uniq.size === 1) continue;
    let aliasHits = 0, score = 0;
    for (const c of row) {
      const k = norm(c);
      if (!k) continue;
      if (ALIAS[k]) { aliasHits++; score += 2; }
      else if (k.length > 1 && k.length < 40 && !/^\d+$/.test(k)) score += 0.2;
    }
    if (aliasHits > bestAlias || (aliasHits === bestAlias && score > bestScore)) {
      bestAlias = aliasHits; bestScore = score; bestIdx = i;
    }
  }
  if (bestIdx === -1) {
    // Fallback: first row with 2+ filled cells.
    for (let i = 0; i < allRows.length; i++) {
      const filled = (allRows[i] ?? []).filter((c) => String(c ?? "").trim() !== "").length;
      if (filled >= 2) return i;
    }
    return 0;
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
  if (br) {
    const [, d, m, y] = br;
    const yyyy = y.length === 2 ? `20${y}` : y;
    return `${yyyy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const t = Date.parse(s);
  if (!isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return null;
}

function normalizePcd(v: any): string | null {
  if (v == null) return null;
  const s = norm(String(v));
  if (!s) return null;
  if (["sim", "s", "1", "true", "yes"].includes(s)) return "sim";
  if (["nao", "n", "0", "false", "no"].includes(s)) return "nao";
  return "nao_informado";
}

function normalizeStatus(v: any): string | null {
  if (!v) return null;
  const s = norm(String(v));
  const map: Record<string, string> = {
    ativo: "ativo", em_acompanhamento: "em_acompanhamento",
    aguardando_retorno: "aguardando_retorno", encaminhado: "encaminhado",
    inativo: "inativo", finalizado: "finalizado",
  };
  return map[s] ?? "ativo";
}

function normalizeGenero(v: any): string | null {
  if (!v) return null;
  const s = norm(String(v));
  if (["m", "masc", "masculino", "homem"].includes(s)) return "Masculino";
  if (["f", "fem", "feminino", "mulher"].includes(s)) return "Feminino";
  return String(v).trim();
}

interface Props { open: boolean; onClose: () => void; onDone: () => void; }

export function ImportarAtendidosDialog({ open, onClose, onDone }: Props) {
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
        const d = detectDelimiter(text);
        setDelim(d);
        loadCsv(text, d);
      } else {
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array", cellDates: false });
        setWorkbook(wb);
        setSheets(wb.SheetNames);
        const sn = wb.SheetNames[0];
        setSheetName(sn);
        loadSheet(wb, sn);
      }
      setStep(2);
    } catch (err: any) {
      toast.error("Não foi possível ler o arquivo. Verifique o formato (.xls, .xlsx ou .csv).");
    }
    e.target.value = "";
  }

  function applyHeaderRow(all: any[][], idx: number) {
    const h = (all[idx] ?? []).map((x) => String(x ?? "").trim());
    const rest = all.slice(idx + 1);
    setHeaders(h);
    setRows(rest);
    autoMap(h);
  }

  function loadCsv(text: string, d: string) {
    const all = parseCSV(text, d);
    if (!all.length) { toast.error("Arquivo vazio."); return; }
    const idx = detectHeaderRow(all);
    setAllRows(all); setHeaderRowIdx(idx);
    applyHeaderRow(all, idx);
  }

  function loadSheet(wb: XLSX.WorkBook, sn: string) {
    const ws = wb.Sheets[sn];
    const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "", raw: true });
    const filtered = aoa.filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
    if (!filtered.length) { toast.error("Aba vazia."); return; }
    const idx = detectHeaderRow(filtered);
    setAllRows(filtered); setHeaderRowIdx(idx);
    applyHeaderRow(filtered, idx);
  }

  function autoMap(h: string[]) {
    const m: Record<number, string> = {};
    h.forEach((col, i) => {
      const key = norm(col);
      m[i] = ALIAS[key] ?? "__ignore__";
    });
    setMapping(m);
  }

  function changeDelim(d: string) {
    setDelim(d);
    if (rawCsvText) loadCsv(rawCsvText, d);
  }

  function changeSheet(sn: string) {
    setSheetName(sn);
    if (workbook) loadSheet(workbook, sn);
  }

  function changeHeaderRow(idx: number) {
    setHeaderRowIdx(idx);
    applyHeaderRow(allRows, idx);
  }

  function buildRecord(r: any[]): any | null {
    const o: any = {};
    headers.forEach((_, i) => {
      const dest = mapping[i];
      if (!dest || dest === "__ignore__") return;
      const raw = r[i];
      if (raw == null || String(raw).trim() === "") return;
      let val: any = String(raw).trim();
      if (dest === "data_nascimento") val = excelDateToISO(raw);
      else if (dest === "idade_importada") { const n = parseInt(String(raw).replace(/\D/g, ""), 10); val = isNaN(n) ? null : n; }
      else if (dest === "pessoa_com_deficiencia") val = normalizePcd(val);
      else if (dest === "status") val = normalizeStatus(val);
      else if (dest === "genero") val = normalizeGenero(val);
      else if (dest === "cpf") val = String(val).replace(/\D/g, "") || null;
      if (val != null && val !== "") o[dest] = val;
    });
    if (!o.nome) return null;
    if (!o.status) o.status = "ativo";
    return o;
  }

  async function importar() {
    setBusy(true);
    const valid: any[] = [];
    let semNome = 0;
    for (const r of rows) {
      const o = buildRecord(r);
      if (!o) { semNome++; continue; }
      valid.push(o);
    }
    if (!valid.length) { setBusy(false); toast.error("Nenhum registro válido. Verifique o mapeamento (campo Nome é obrigatório)."); return; }

    // Split: with id_externo (upsert) vs without (insert)
    const comId = valid.filter((o) => o.id_externo);
    const semId = valid.filter((o) => !o.id_externo);

    let novos = 0, atualizados = 0, erros = 0;

    if (comId.length) {
      const { data, error } = await supabase.from("atendidos").upsert(comId, { onConflict: "id_externo", ignoreDuplicates: false }).select("id");
      if (error) { erros += comId.length; toast.error(`Erro upsert: ${error.message}`); }
      else { atualizados += data?.length ?? 0; }
    }
    if (semId.length) {
      const { data, error } = await supabase.from("atendidos").insert(semId).select("id");
      if (error) { erros += semId.length; toast.error(`Erro insert: ${error.message}`); }
      else { novos += data?.length ?? 0; }
    }

    setBusy(false);
    const msgs = [`${novos + atualizados} atendido(s) processado(s)`];
    if (semNome) msgs.push(`${semNome} sem nome ignorado(s)`);
    if (erros) msgs.push(`${erros} com erro`);
    toast.success(`Importação concluída. ${msgs.join(" • ")}.`);
    onDone(); reset(); onClose();
  }

  function baixarModelo() {
    const headers = ["ID_Atendido", "Nome civil", "Matrícula", "Gênero", "Data de nascimento", "Idade", "CPF", "Telefone", "WhatsApp", "Cidade", "Bairro", "Nome do responsável", "Telefone do responsável", "Status", "Observações"];
    const ws = XLSX.utils.aoa_to_sheet([headers, ["12345", "João da Silva", "F250001230", "Masculino", "16/11/1977", "48", "", "(11) 99999-0000", "", "São Paulo", "Centro", "Maria da Silva", "(11) 98888-0000", "ativo", ""]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Atendidos");
    XLSX.writeFile(wb, "modelo-atendidos.xlsx");
  }

  const totalLinhas = rows.length;
  const validos = rows.filter((r) => buildRecord(r)).length;
  const semNomeCount = totalLinhas - validos;
  const comIdCount = rows.filter((r) => { const o = buildRecord(r); return o && o.id_externo; }).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar atendidos</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Envie sua planilha em formato <b>.xls</b>, <b>.xlsx</b> ou <b>.csv</b>. O sistema fará a leitura,
              detectará automaticamente o cabeçalho e permitirá revisar antes de importar.
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center px-4 h-10 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90">
                <Upload className="w-4 h-4 mr-2" /> Selecionar planilha Excel
                <input type="file" accept=".csv,.tsv,.txt,.xls,.xlsx" className="hidden" onChange={handleFile} />
              </label>
              <Button variant="outline" onClick={baixarModelo}>
                <Download className="w-4 h-4 mr-2" /> Baixar modelo de planilha
              </Button>
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
                <Input
                  type="number"
                  min={1}
                  max={Math.min(allRows.length, 20)}
                  value={headerRowIdx + 1}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(allRows.length, parseInt(e.target.value || "1", 10)));
                    changeHeaderRow(n - 1);
                  }}
                  className="w-32"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Detectada automaticamente. Ajuste se necessário.</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Mapeamento de colunas</h3>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr><th className="p-2 text-left">Coluna do arquivo</th><th className="p-2 text-left">Campo do sistema</th><th className="p-2 text-left">Exemplo</th></tr>
                  </thead>
                  <tbody>
                    {headers.map((h, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-mono text-xs">{h || `(coluna ${i + 1})`}</td>
                        <td className="p-2">
                          <Select value={mapping[i] ?? "__ignore__"} onValueChange={(v) => setMapping({ ...mapping, [i]: v })}>
                            <SelectTrigger className="w-56 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>{CAMPOS_DESTINO.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs truncate max-w-xs">{String(rows[0]?.[i] ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!Object.values(mapping).includes("nome") && (
                <p className="text-xs text-destructive mt-2">⚠ Mapeie pelo menos uma coluna como <b>Nome</b>.</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Stat label="Linhas" v={totalLinhas} />
              <Stat label="Válidos" v={validos} />
              <Stat label="Com ID externo (atualiza)" v={comIdCount} />
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
              <Button variant="ghost" onClick={() => { reset(); }}>Cancelar</Button>
              <Button disabled={busy || !Object.values(mapping).includes("nome")} onClick={importar}>
                {busy ? "Importando..." : `Importar ${validos} registros`}
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
