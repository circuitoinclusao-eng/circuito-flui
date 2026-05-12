// Bússola — consolidação de planilhas de atendimento PCD
// Estado persistido no localStorage do navegador (protótipo).

export type Grau = "leve" | "moderado" | "severo" | "profundo" | "nao_informado";

export const GRAUS: { value: Grau; label: string; color: string }[] = [
  { value: "leve", label: "Leve", color: "hsl(var(--chart-1, 199 89% 48%))" },
  { value: "moderado", label: "Moderado", color: "hsl(var(--chart-2, 142 71% 45%))" },
  { value: "severo", label: "Severo", color: "hsl(var(--chart-3, 38 92% 50%))" },
  { value: "profundo", label: "Profundo", color: "hsl(var(--chart-4, 0 84% 60%))" },
  { value: "nao_informado", label: "Não informado", color: "hsl(var(--chart-5, 240 5% 65%))" },
];

export const CAMPOS_PADRAO = [
  { key: "id_registro", label: "ID do atendimento", required: true },
  { key: "id_pessoa", label: "ID/Nome da pessoa", required: true },
  { key: "data_atendimento", label: "Data do atendimento", required: true },
  { key: "tipo_deficiencia", label: "Tipo de deficiência", required: false },
  { key: "grau", label: "Grau", required: true },
  { key: "unidade", label: "Unidade", required: false },
  { key: "territorio", label: "Território", required: false },
  { key: "servico", label: "Serviço", required: false },
  { key: "sexo", label: "Sexo", required: false },
  { key: "faixa_etaria", label: "Faixa etária", required: false },
] as const;

export type CampoKey = (typeof CAMPOS_PADRAO)[number]["key"];

export interface Registro {
  id_registro: string;
  id_pessoa: string;
  data_atendimento: string; // ISO yyyy-mm-dd
  tipo_deficiencia?: string;
  grau: Grau;
  unidade?: string;
  territorio?: string;
  servico?: string;
  sexo?: string;
  faixa_etaria?: string;
  origem_fonte: string;
}

export interface Fonte {
  id: string;
  nome: string;
  tipo: string; // xlsx | csv | manual
  data_importacao: string;
  status: "ok" | "alerta" | "erro";
  observacoes?: string;
  total_linhas: number;
  total_validas: number;
}

export interface LogEntry {
  id: string;
  data_hora: string;
  fonte: string;
  status: "ok" | "alerta" | "erro";
  mensagem: string;
}

interface Store {
  fontes: Fonte[];
  registros: Registro[];
  logs: LogEntry[];
}

const KEY = "bussola_store_v1";

const seed = (): Store => {
  const hoje = new Date();
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
    return d;
  });
  const unidades = ["Centro", "Norte", "Sul", "Leste"];
  const servicos = ["Acolhimento", "Reabilitação", "Orientação familiar", "Atendimento social"];
  const tipos = ["Física", "Visual", "Auditiva", "Intelectual", "Múltipla"];
  const territorios = ["Distrito 1", "Distrito 2", "Distrito 3"];
  const grausArr: Grau[] = ["leve", "moderado", "severo", "profundo", "nao_informado"];
  const registros: Registro[] = [];
  let n = 1;
  for (const m of meses) {
    const qtd = 30 + Math.floor(Math.random() * 30);
    for (let i = 0; i < qtd; i++) {
      const dia = 1 + Math.floor(Math.random() * 27);
      registros.push({
        id_registro: `BUS-${String(n).padStart(5, "0")}`,
        id_pessoa: `P-${String(1000 + (n % 280)).padStart(4, "0")}`,
        data_atendimento: new Date(m.getFullYear(), m.getMonth(), dia).toISOString().slice(0, 10),
        tipo_deficiencia: tipos[Math.floor(Math.random() * tipos.length)],
        grau: grausArr[Math.floor(Math.random() * grausArr.length)],
        unidade: unidades[Math.floor(Math.random() * unidades.length)],
        territorio: territorios[Math.floor(Math.random() * territorios.length)],
        servico: servicos[Math.floor(Math.random() * servicos.length)],
        sexo: Math.random() > 0.5 ? "F" : "M",
        faixa_etaria: ["0-12", "13-18", "19-29", "30-59", "60+"][Math.floor(Math.random() * 5)],
        origem_fonte: "Amostra Bússola (demo)",
      });
      n++;
    }
  }
  const fontes: Fonte[] = [
    {
      id: "demo-1",
      nome: "Amostra Bússola (demo)",
      tipo: "xlsx",
      data_importacao: new Date().toISOString(),
      status: "ok",
      total_linhas: registros.length,
      total_validas: registros.length,
      observacoes: "Dados gerados para demonstração.",
    },
  ];
  const logs: LogEntry[] = [
    {
      id: crypto.randomUUID(),
      data_hora: new Date().toISOString(),
      fonte: "Amostra Bússola (demo)",
      status: "ok",
      mensagem: `Importadas ${registros.length} linhas com sucesso.`,
    },
  ];
  return { fontes, registros, logs };
};

export function loadStore(): Store {
  if (typeof window === "undefined") return { fontes: [], registros: [], logs: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  } catch {
    return { fontes: [], registros: [], logs: [] };
  }
}

export function saveStore(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("bussola:update"));
}

export function resetStore() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("bussola:update"));
}

export function normalizeGrau(v: any): Grau {
  const s = String(v ?? "").toLowerCase().trim();
  if (!s) return "nao_informado";
  if (s.startsWith("lev") || s === "1" || s === "i") return "leve";
  if (s.startsWith("mod") || s === "2" || s === "ii") return "moderado";
  if (s.startsWith("sev") || s.startsWith("grav") || s === "3" || s === "iii") return "severo";
  if (s.startsWith("prof") || s === "4" || s === "iv") return "profundo";
  return "nao_informado";
}

export function parseDate(v: any): string | null {
  if (!v) return null;
  if (typeof v === "number") {
    // serial Excel
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const yy = y.length === 2 ? "20" + y : y;
    return `${yy}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export function consolidar(
  rows: any[],
  mapping: Partial<Record<CampoKey, string>>,
  fonteNome: string,
  opts: { dedup: boolean }
): { registros: Registro[]; alertas: string[] } {
  const alertas: string[] = [];
  const out: Registro[] = [];
  rows.forEach((row, i) => {
    const get = (k: CampoKey) => {
      const col = mapping[k];
      return col ? row[col] : undefined;
    };
    const data = parseDate(get("data_atendimento"));
    const idr = String(get("id_registro") ?? "").trim();
    const idp = String(get("id_pessoa") ?? "").trim();
    if (!idr || !idp || !data) {
      alertas.push(`Linha ${i + 2}: campos obrigatórios ausentes.`);
      return;
    }
    out.push({
      id_registro: idr,
      id_pessoa: idp,
      data_atendimento: data,
      tipo_deficiencia: String(get("tipo_deficiencia") ?? "").trim() || undefined,
      grau: normalizeGrau(get("grau")),
      unidade: String(get("unidade") ?? "").trim() || undefined,
      territorio: String(get("territorio") ?? "").trim() || undefined,
      servico: String(get("servico") ?? "").trim() || undefined,
      sexo: String(get("sexo") ?? "").trim() || undefined,
      faixa_etaria: String(get("faixa_etaria") ?? "").trim() || undefined,
      origem_fonte: fonteNome,
    });
  });
  if (opts.dedup) {
    const seen = new Set<string>();
    const dedup = out.filter((r) => {
      const k = `${r.id_pessoa}|${r.data_atendimento}|${r.servico ?? ""}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (dedup.length !== out.length) {
      alertas.push(`${out.length - dedup.length} linha(s) duplicada(s) removida(s).`);
    }
    return { registros: dedup, alertas };
  }
  return { registros: out, alertas };
}

export function autoMap(headers: string[]): Partial<Record<CampoKey, string>> {
  const m: Partial<Record<CampoKey, string>> = {};
  const find = (...needles: string[]) =>
    headers.find((h) => {
      const n = h.toLowerCase();
      return needles.some((x) => n.includes(x));
    });
  m.id_registro = find("id_atend", "id atend", "registro", "protocolo", "id_reg") ?? find("id");
  m.id_pessoa = find("id_pess", "pessoa", "nome", "beneficiario", "atendido");
  m.data_atendimento = find("data");
  m.tipo_deficiencia = find("tipo", "deficien");
  m.grau = find("grau", "severid", "nivel");
  m.unidade = find("unidade");
  m.territorio = find("territor", "regional", "distrito");
  m.servico = find("servic", "programa");
  m.sexo = find("sexo", "genero");
  m.faixa_etaria = find("faixa", "idade");
  return m;
}
