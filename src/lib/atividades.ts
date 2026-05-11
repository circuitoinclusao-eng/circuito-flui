export const ENCONTRO_STATUS = [
  { value: "realizada", label: "Realizada", color: "bg-success/15 text-success border-success/30" },
  { value: "cancelada", label: "Cancelada", color: "bg-destructive/15 text-destructive border-destructive/30" },
  { value: "nao_realizada", label: "Não realizada", color: "bg-warning/15 text-warning border-warning/40" },
  { value: "nao_registrada", label: "Não registrada", color: "bg-muted text-muted-foreground border-border" },
] as const;

export const FORMATO_EXECUCAO = [
  { value: "curso", label: "Curso" },
  { value: "atividade_unica", label: "Atividade única" },
] as const;

export const PERIODOS = [
  { value: "matutino", label: "Matutino" },
  { value: "vespertino", label: "Vespertino" },
  { value: "noturno", label: "Noturno" },
] as const;

export const INSCRITO_STATUS = [
  { value: "inscrito", label: "Inscrito" },
  { value: "espera", label: "Em espera" },
  { value: "removido", label: "Removido" },
] as const;

export function statusEncontroLabel(s: string) {
  return ENCONTRO_STATUS.find((x) => x.value === s)?.label ?? s;
}

export function statusEncontroColor(s: string) {
  return ENCONTRO_STATUS.find((x) => x.value === s)?.color ?? "";
}

export function calcularIdade(dataNasc?: string | null): number | null {
  if (!dataNasc) return null;
  const d = new Date(dataNasc);
  const hoje = new Date();
  let idade = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) idade--;
  return idade;
}

export function downloadCSV(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows.map((r) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(u);
}
