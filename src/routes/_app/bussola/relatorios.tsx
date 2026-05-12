import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { GRAUS, loadStore, type Grau, type Registro } from "@/lib/bussola";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  CartesianGrid,
} from "recharts";
import { FileDown, Printer } from "lucide-react";
import { FiltrosBar, aplicarFiltros, uniques } from "./index";

export const Route = createFileRoute("/_app/bussola/relatorios")({
  component: BussolaRelatorios,
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

function BussolaRelatorios() {
  const store = useStore();
  const [f, setF] = useState({ de: "", ate: "", unidade: "", territorio: "", servico: "", tipo: "", grau: "" });
  const filtrados = useMemo(() => aplicarFiltros(store.registros, f), [store.registros, f]);

  const porGrau = useMemo(() => {
    const map = new Map<Grau, Set<string>>();
    GRAUS.forEach((g) => map.set(g.value, new Set()));
    filtrados.forEach((r) => map.get(r.grau)!.add(r.id_pessoa));
    const totalPessoas = new Set(filtrados.map((r) => r.id_pessoa)).size;
    return GRAUS.map((g) => {
      const v = map.get(g.value)!.size;
      return { name: g.label, value: v, color: g.color, key: g.value, pct: totalPessoas ? (v / totalPessoas) * 100 : 0 };
    });
  }, [filtrados]);

  const totalPessoas = porGrau.reduce((s, x) => s + x.value, 0);

  function exportCSV() {
    const rows: any[][] = [["Grau", "Pessoas", "% do total"]];
    porGrau.forEach((g) => rows.push([g.name, g.value, g.pct.toFixed(1) + "%"]));
    rows.push([]);
    rows.push(["Detalhamento dos atendimentos"]);
    rows.push(["ID", "Pessoa", "Data", "Tipo", "Grau", "Unidade", "Território", "Serviço", "Origem"]);
    filtrados.forEach((r: Registro) =>
      rows.push([r.id_registro, r.id_pessoa, r.data_atendimento, r.tipo_deficiencia ?? "", r.grau, r.unidade ?? "", r.territorio ?? "", r.servico ?? "", r.origem_fonte])
    );
    const csv = rows.map((r) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    download(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), "relatorio-bussola.csv");
  }

  function exportXLSX() {
    const wb = XLSX.utils.book_new();
    const resumo = [["Grau", "Pessoas", "% do total"], ...porGrau.map((g) => [g.name, g.value, +g.pct.toFixed(1)])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), "Resumo por Grau");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(filtrados),
      "Atendimentos"
    );
    XLSX.writeFile(wb, "relatorio-bussola.xlsx");
  }

  return (
    <>
      <FiltrosBar registros={store.registros} f={f} setF={setF} />

      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Button variant="outline" size="sm" onClick={exportCSV}><FileDown className="w-4 h-4 mr-1" /> CSV</Button>
        <Button variant="outline" size="sm" onClick={exportXLSX}><FileDown className="w-4 h-4 mr-1" /> Excel</Button>
        <Button size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> PDF / Imprimir</Button>
      </div>

      <Card className="p-6 mb-4">
        <div className="border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold">Relatório de quantidade de pessoas com deficiência atendidas e o grau</h2>
          <p className="text-sm text-muted-foreground">
            Período: {f.de || "início"} até {f.ate || "hoje"} • {filtrados.length} atendimentos •{" "}
            <strong>{totalPessoas}</strong> pessoas únicas
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={porGrau}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Pessoas" radius={[6, 6, 0, 0]}>
                  {porGrau.map((d) => <Cell key={d.key} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={porGrau.filter((d) => d.value > 0)} dataKey="value" nameKey="name" outerRadius={100} label={(e: any) => `${e.name}: ${e.value}`}>
                  {porGrau.map((d) => <Cell key={d.key} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <h3 className="font-semibold mb-2">Tabela resumida</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2">Grau</th>
                <th className="text-right px-4 py-2">Pessoas</th>
                <th className="text-right px-4 py-2">% do total</th>
              </tr>
            </thead>
            <tbody>
              {porGrau.map((g) => (
                <tr key={g.key} className="border-t">
                  <td className="px-4 py-2 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: g.color }} />
                    {g.name}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">{g.value.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2 text-right">{g.pct.toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="border-t bg-muted/30 font-semibold">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right">{totalPessoas.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2 text-right">100,0%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div><strong className="text-foreground">Unidades incluídas:</strong> {uniques(filtrados, "unidade").join(", ") || "—"}</div>
          <div><strong className="text-foreground">Territórios:</strong> {uniques(filtrados, "territorio").join(", ") || "—"}</div>
          <div><strong className="text-foreground">Serviços:</strong> {uniques(filtrados, "servico").join(", ") || "—"}</div>
        </div>
      </Card>
    </>
  );
}

function download(blob: Blob, name: string) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u; a.download = name; a.click();
  URL.revokeObjectURL(u);
}
