import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/AppLayout";
import { StatCard } from "@/components/Cards";
import { FileDown, BarChart3, Users, CalendarRange, Camera } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/relatorios/")({
  component: Relatorios,
});

function Relatorios() {
  const [projetos, setProjetos] = useState<any[]>([]);
  const [filtros, setFiltros] = useState<any>({ projeto: "", de: "", ate: "" });
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    supabase.from("projetos").select("id,titulo").order("titulo").then(({ data }) => setProjetos(data ?? []));
  }, []);

  async function gerar() {
    let q = supabase.from("atividades").select("*");
    if (filtros.projeto) q = q.eq("projeto_id", filtros.projeto);
    if (filtros.de) q = q.gte("data", filtros.de);
    if (filtros.ate) q = q.lte("data", filtros.ate);
    const { data: ativ } = await q;

    let qa = supabase.from("atendimentos").select("*");
    if (filtros.de) qa = qa.gte("data", filtros.de);
    if (filtros.ate) qa = qa.lte("data", filtros.ate);
    const { data: at } = await qa;

    const ids = (ativ ?? []).map((a: any) => a.id);
    let fotosCount = 0;
    if (ids.length) {
      const { count } = await supabase.from("fotos").select("*", { count: "exact", head: true }).in("atividade_id", ids);
      fotosCount = count ?? 0;
    }

    setResultado({
      atividades: ativ?.length ?? 0,
      atendidos: (ativ ?? []).reduce((s: number, a: any) => s + (a.participantes_atendidos ?? 0), 0),
      atendimentos: at?.length ?? 0,
      fotos: fotosCount,
      ativ: ativ ?? [],
    });
    toast.success("Relatório gerado.");
  }

  function exportCSV() {
    if (!resultado) return;
    const rows = [["Título", "Data", "Tipo", "Local", "Atendidos", "Status"]];
    resultado.ativ.forEach((a: any) =>
      rows.push([a.titulo, a.data ?? "", a.tipo ?? "", a.local ?? "", a.participantes_atendidos ?? 0, a.status])
    );
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = u; link.download = `relatorio.csv`; link.click();
    URL.revokeObjectURL(u);
  }

  return (
    <>
      <PageHeader breadcrumb={["Início", "Relatórios"]} title="Gráficos e Relatórios" />

      <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-semibold mb-3">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Projeto</Label>
            <Select value={filtros.projeto} onValueChange={(v) => setFiltros({ ...filtros, projeto: v === "todos" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>De</Label><Input type="date" value={filtros.de} onChange={(e) => setFiltros({ ...filtros, de: e.target.value })} /></div>
          <div><Label>Até</Label><Input type="date" value={filtros.ate} onChange={(e) => setFiltros({ ...filtros, ate: e.target.value })} /></div>
          <div className="flex items-end gap-2">
            <Button onClick={gerar} className="flex-1"><BarChart3 className="w-4 h-4 mr-1" /> Gerar</Button>
          </div>
        </div>
      </div>

      {resultado && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Atividades" value={resultado.atividades} icon={CalendarRange} variant="blue" />
            <StatCard label="Pessoas atendidas" value={resultado.atendidos} icon={Users} variant="lilac" />
            <StatCard label="Atendimentos" value={resultado.atendimentos} icon={Users} variant="teal" />
            <StatCard label="Fotos anexadas" value={resultado.fotos} icon={Camera} variant="amber" />
          </div>

          <div className="bg-card border rounded-xl shadow-sm">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold">Detalhamento</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportCSV}><FileDown className="w-4 h-4 mr-1" /> CSV</Button>
                <Button size="sm" variant="outline" onClick={() => window.print()}><FileDown className="w-4 h-4 mr-1" /> Imprimir / PDF</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2">Atividade</th>
                    <th className="text-left px-4 py-2">Data</th>
                    <th className="text-left px-4 py-2">Local</th>
                    <th className="text-left px-4 py-2">Atendidos</th>
                    <th className="text-left px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.ativ.map((a: any) => (
                    <tr key={a.id} className="border-t">
                      <td className="px-4 py-2 font-medium">{a.titulo}</td>
                      <td className="px-4 py-2">{a.data ? new Date(a.data).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="px-4 py-2">{a.local ?? "—"}</td>
                      <td className="px-4 py-2">{a.participantes_atendidos ?? 0}</td>
                      <td className="px-4 py-2">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
