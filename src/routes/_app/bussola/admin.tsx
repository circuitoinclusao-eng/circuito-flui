import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadStore, resetStore, saveStore } from "@/lib/bussola";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/bussola/admin")({
  component: BussolaAdmin,
});

function useStore() {
  const [s, setS] = useState(() => loadStore());
  useEffect(() => {
    const fn = () => setS(loadStore());
    window.addEventListener("bussola:update", fn);
    return () => window.removeEventListener("bussola:update", fn);
  }, []);
  return s;
}

function BussolaAdmin() {
  const store = useStore();

  function removerFonte(id: string, nome: string) {
    if (!confirm(`Remover fonte "${nome}" e todos os seus registros?`)) return;
    const s = loadStore();
    s.fontes = s.fontes.filter((f) => f.id !== id);
    s.registros = s.registros.filter((r) => r.origem_fonte !== nome);
    s.logs.unshift({
      id: crypto.randomUUID(),
      data_hora: new Date().toISOString(),
      fonte: nome,
      status: "alerta",
      mensagem: "Fonte e registros removidos pelo administrador.",
    });
    saveStore(s);
    toast.success("Fonte removida.");
  }

  function reset() {
    if (!confirm("Reiniciar Bússola? Todos os dados serão substituídos pela amostra de demonstração.")) return;
    resetStore();
    loadStore();
    toast.success("Dados restaurados.");
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold">Fontes de dados</h2>
            <p className="text-sm text-muted-foreground">
              Planilhas e fontes recorrentes vinculadas ao Bússola.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Restaurar amostra
          </Button>
        </div>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2">Fonte</th>
                <th className="text-left px-4 py-2">Tipo</th>
                <th className="text-left px-4 py-2">Importação</th>
                <th className="text-left px-4 py-2">Linhas</th>
                <th className="text-left px-4 py-2">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {store.fontes.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Nenhuma fonte cadastrada.</td></tr>
              )}
              {store.fontes.map((f) => (
                <tr key={f.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{f.nome}</td>
                  <td className="px-4 py-2 uppercase text-xs">{f.tipo}</td>
                  <td className="px-4 py-2">{new Date(f.data_importacao).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2">{f.total_validas} / {f.total_linhas}</td>
                  <td className="px-4 py-2"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => removerFonte(f.id, f.nome)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-1">Logs de processamento</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Histórico das últimas importações e alterações.
        </p>
        <ul className="divide-y">
          {store.logs.length === 0 && <li className="py-6 text-center text-muted-foreground text-sm">Sem registros.</li>}
          {store.logs.slice(0, 30).map((l) => (
            <li key={l.id} className="py-3 flex items-start gap-3">
              <StatusIcon status={l.status} />
              <div className="flex-1">
                <div className="text-sm">{l.mensagem}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(l.data_hora).toLocaleString("pt-BR")} • {l.fonte}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ok") return <Badge className="bg-success/15 text-success hover:bg-success/15">OK</Badge>;
  if (status === "alerta") return <Badge className="bg-warning/20 text-warning-foreground hover:bg-warning/20">Alerta</Badge>;
  return <Badge variant="destructive">Erro</Badge>;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "ok") return <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />;
  if (status === "alerta") return <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />;
  return <XCircle className="w-4 h-4 text-destructive mt-0.5" />;
}
