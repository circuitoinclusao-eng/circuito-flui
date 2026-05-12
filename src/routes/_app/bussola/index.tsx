import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { loadStore, GRAUS, type Grau, type Registro } from "@/lib/bussola";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { Users, Activity, Building2, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/bussola/")({
  component: BussolaPainel,
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

interface Filtros {
  de: string; ate: string; unidade: string; territorio: string; servico: string; tipo: string; grau: string;
}

export function aplicarFiltros(regs: Registro[], f: Filtros) {
  return regs.filter((r) => {
    if (f.de && r.data_atendimento < f.de) return false;
    if (f.ate && r.data_atendimento > f.ate) return false;
    if (f.unidade && r.unidade !== f.unidade) return false;
    if (f.territorio && r.territorio !== f.territorio) return false;
    if (f.servico && r.servico !== f.servico) return false;
    if (f.tipo && r.tipo_deficiencia !== f.tipo) return false;
    if (f.grau && r.grau !== f.grau) return false;
    return true;
  });
}

export function uniques(regs: Registro[], k: keyof Registro) {
  return Array.from(new Set(regs.map((r) => r[k]).filter(Boolean) as string[])).sort();
}

function BussolaPainel() {
  const store = useStore();
  const [f, setF] = useState<Filtros>({ de: "", ate: "", unidade: "", territorio: "", servico: "", tipo: "", grau: "" });

  const filtrados = useMemo(() => aplicarFiltros(store.registros, f), [store.registros, f]);
  const pessoas = useMemo(() => new Set(filtrados.map((r) => r.id_pessoa)).size, [filtrados]);

  const porGrau = useMemo(() => {
    const map = new Map<Grau, Set<string>>();
    GRAUS.forEach((g) => map.set(g.value, new Set()));
    filtrados.forEach((r) => map.get(r.grau)!.add(r.id_pessoa));
    return GRAUS.map((g) => ({ name: g.label, value: map.get(g.value)!.size, color: g.color, key: g.value }));
  }, [filtrados]);

  const porMes = useMemo(() => {
    const map = new Map<string, Set<string>>();
    filtrados.forEach((r) => {
      const k = r.data_atendimento.slice(0, 7);
      if (!map.has(k)) map.set(k, new Set());
      map.get(k)!.add(r.id_pessoa);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, set]) => ({ mes, pessoas: set.size }));
  }, [filtrados]);

  return (
    <>
      <FiltrosBar registros={store.registros} f={f} setF={setF} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={Users} label="Pessoas atendidas (PCD)" value={pessoas} color="bg-primary/10 text-primary" />
        <Stat icon={Activity} label="Total de atendimentos" value={filtrados.length} color="bg-info/10 text-info" />
        <Stat icon={Building2} label="Unidades" value={uniques(filtrados, "unidade").length} color="bg-success/10 text-success" />
        <Stat icon={MapPin} label="Territórios" value={uniques(filtrados, "territorio").length} color="bg-warning/20 text-warning-foreground" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-1">Pessoas com deficiência por grau</h3>
          <p className="text-xs text-muted-foreground mb-3">Distribuição de pessoas únicas por grau de deficiência.</p>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={porGrau}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {porGrau.map((d) => <Cell key={d.key} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-1">Composição por grau</h3>
          <p className="text-xs text-muted-foreground mb-3">Participação relativa de cada grau no total.</p>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={porGrau.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {porGrau.map((d) => <Cell key={d.key} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-1">Evolução mensal — pessoas atendidas</h3>
        <p className="text-xs text-muted-foreground mb-3">Pessoas únicas atendidas por mês de competência.</p>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={porMes}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="pessoas" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}

export function FiltrosBar({
  registros, f, setF,
}: { registros: Registro[]; f: Filtros; setF: (f: Filtros) => void }) {
  const unidades = uniques(registros, "unidade");
  const territorios = uniques(registros, "territorio");
  const servicos = uniques(registros, "servico");
  const tipos = uniques(registros, "tipo_deficiencia");

  const sel = (val: string, key: keyof Filtros) => setF({ ...f, [key]: val === "todos" ? "" : val });

  return (
    <Card className="p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div><Label className="text-xs">De</Label><Input type="date" value={f.de} onChange={(e) => setF({ ...f, de: e.target.value })} /></div>
        <div><Label className="text-xs">Até</Label><Input type="date" value={f.ate} onChange={(e) => setF({ ...f, ate: e.target.value })} /></div>
        <FiltroSelect label="Unidade" value={f.unidade} options={unidades} onChange={(v) => sel(v, "unidade")} />
        <FiltroSelect label="Território" value={f.territorio} options={territorios} onChange={(v) => sel(v, "territorio")} />
        <FiltroSelect label="Serviço" value={f.servico} options={servicos} onChange={(v) => sel(v, "servico")} />
        <FiltroSelect label="Tipo" value={f.tipo} options={tipos} onChange={(v) => sel(v, "tipo")} />
        <div>
          <Label className="text-xs">Grau</Label>
          <Select value={f.grau || "todos"} onValueChange={(v) => sel(v, "grau")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {GRAUS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

function FiltroSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value || "todos"} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value.toLocaleString("pt-BR")}</div>
        </div>
      </div>
    </Card>
  );
}
