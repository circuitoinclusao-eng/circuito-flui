export const PROJETO_STATUS = [
  { value: "rascunho", label: "Rascunho" },
  { value: "em_elaboracao", label: "Em elaboração" },
  { value: "enviado", label: "Enviado" },
  { value: "em_analise", label: "Em análise" },
  { value: "aprovado", label: "Aprovado" },
  { value: "em_execucao", label: "Em execução" },
  { value: "suspenso", label: "Suspenso" },
  { value: "finalizado", label: "Finalizado" },
  { value: "em_prestacao_contas", label: "Em prestação de contas" },
  { value: "prestacao_enviada", label: "Prestação enviada" },
  { value: "encerrado", label: "Encerrado" },
  { value: "reprovado", label: "Reprovado" },
  { value: "arquivado", label: "Arquivado" },
] as const;

export const META_STATUS = [
  { value: "nao_iniciada", label: "Não iniciada" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "parcialmente_cumprida", label: "Parcialmente cumprida" },
  { value: "cumprida", label: "Cumprida" },
  { value: "nao_cumprida", label: "Não cumprida" },
] as const;

export const CRONOGRAMA_STATUS = [
  { value: "planejado", label: "Planejado" },
  { value: "em_execucao", label: "Em execução" },
  { value: "concluido", label: "Concluído" },
  { value: "atrasado", label: "Atrasado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export const PRESTACAO_STATUS = [
  { value: "nao_iniciada", label: "Não iniciada" },
  { value: "em_elaboracao", label: "Em elaboração" },
  { value: "enviada", label: "Enviada" },
  { value: "em_analise", label: "Em análise" },
  { value: "aprovada", label: "Aprovada" },
  { value: "reprovada", label: "Reprovada" },
  { value: "com_pendencia", label: "Com pendência" },
  { value: "finalizada", label: "Finalizada" },
] as const;

export const CATEGORIAS_ORCAMENTO = [
  "Recursos humanos", "Material de consumo", "Material permanente",
  "Transporte", "Alimentação", "Comunicação", "Uniformes",
  "Equipamentos", "Serviços de terceiros", "Acessibilidade", "Outros",
];

export const TIPOS_DOCUMENTO_PROJETO = [
  "Projeto original", "Plano de trabalho", "Termo de fomento", "Contrato",
  "Orçamento", "Nota fiscal", "Comprovante", "Relatório", "Foto",
  "Autorização", "Prestação de contas", "Outro",
];

export function projetoStatusLabel(v?: string | null) {
  return PROJETO_STATUS.find((s) => s.value === v)?.label ?? v ?? "—";
}

export function projetoStatusClass(v?: string | null) {
  const map: Record<string, string> = {
    rascunho: "bg-muted text-muted-foreground",
    em_elaboracao: "bg-warning/20 text-warning-foreground",
    enviado: "bg-info/15 text-info",
    em_analise: "bg-info/15 text-info",
    aprovado: "bg-success/15 text-success",
    em_execucao: "bg-primary/15 text-primary",
    suspenso: "bg-destructive/10 text-destructive",
    finalizado: "bg-success/15 text-success",
    em_prestacao_contas: "bg-warning/20 text-warning-foreground",
    prestacao_enviada: "bg-info/15 text-info",
    encerrado: "bg-muted text-muted-foreground",
    reprovado: "bg-destructive/10 text-destructive",
    arquivado: "bg-muted text-muted-foreground",
  };
  return map[v ?? ""] ?? "bg-muted text-muted-foreground";
}

export function prestacaoStatusLabel(v?: string | null) {
  return PRESTACAO_STATUS.find((s) => s.value === v)?.label ?? v ?? "—";
}

export function metaStatusLabel(v?: string | null) {
  return META_STATUS.find((s) => s.value === v)?.label ?? v ?? "—";
}

export function cronogramaStatusLabel(v?: string | null) {
  return CRONOGRAMA_STATUS.find((s) => s.value === v)?.label ?? v ?? "—";
}

export function formatBRL(v?: number | string | null): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function downloadCSV(filename: string, rows: any[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
