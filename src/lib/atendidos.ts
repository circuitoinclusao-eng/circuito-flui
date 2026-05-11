export const ATENDIDO_STATUS = [
  { value: "ativo", label: "Ativo" },
  { value: "em_acompanhamento", label: "Em acompanhamento" },
  { value: "aguardando_retorno", label: "Aguardando retorno" },
  { value: "encaminhado", label: "Encaminhado" },
  { value: "inativo", label: "Inativo" },
  { value: "finalizado", label: "Finalizado" },
] as const;

export const PCD_OPTIONS = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "nao_informado", label: "Não informado" },
] as const;

export const MARCADORES_PADRAO = [
  "Autismo", "Síndrome de Down", "Mobilidade reduzida",
  "Power Soccer", "Atletismo", "Judô", "Capoeira", "Dança",
  "Família acompanhada", "Prioridade", "Aguardando documento", "Encaminhamento social",
];

export const TIPO_DOCUMENTO = [
  "Documento pessoal", "Comprovante de endereço", "Laudo",
  "Autorização de imagem", "Ficha de inscrição", "Outro",
];

export function calcularIdade(data?: string | null): number | null {
  if (!data) return null;
  const d = new Date(data);
  if (isNaN(d.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) idade--;
  return idade;
}

export function statusLabel(value?: string | null) {
  return ATENDIDO_STATUS.find((s) => s.value === value)?.label ?? value ?? "—";
}

export function statusClass(value?: string | null) {
  const map: Record<string, string> = {
    ativo: "bg-success/15 text-success",
    em_acompanhamento: "bg-primary/15 text-primary",
    aguardando_retorno: "bg-warning/20 text-warning-foreground",
    encaminhado: "bg-info/15 text-info",
    inativo: "bg-muted text-muted-foreground",
    finalizado: "bg-muted text-muted-foreground",
  };
  return map[value ?? ""] ?? "bg-muted text-muted-foreground";
}

export function maskCPF(cpf?: string | null) {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function hideCPF(cpf?: string | null) {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return "•••";
  return `•••.${d.slice(3, 6)}.•••-••`;
}
