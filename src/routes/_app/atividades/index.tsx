import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MODALIDADES } from "@/lib/atividades";
import { useAuth } from "@/lib/auth";
import { Plus, Eye, Pencil, ClipboardList, FileBarChart, Search, X } from "lucide-react";

export const Route = createFileRoute("/_app/atividades/")({
  component: AtividadesList,
});

const STATUS_OPTS = [
  { v: "planejada", l: "Planejada" },
  { v: "ativa", l: "Ativa" },
  { v: "pausada", l: "Pausada" },
  { v: "encerrada", l: "Encerrada" },
];

const ALL = "__all__";

function AtividadesList() {
  const { canEdit, isAdminOrCoord } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [fProj, setFProj] = useState<string>(ALL);
  const [fCidade, setFCidade] = useState<string>(ALL);
  const [fMod, setFMod] = useState<string>(ALL);
  const [fProf, setFProf] = useState<string>(ALL);
  const [fStatus, setFStatus] = useState<string>(ALL);
  const [fIni, setFIni] = useState("");
  const [fFim, setFFim] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: a }, { data: p }, { data: prof }] = await Promise.all([
        supabase.from("atividades").select("*").order("data", { ascending: false, nullsFirst: false }),
        supabase.from("projetos").select("id,titulo,cidade").order("titulo"),
        supabase.from("profiles").select("id,nome").order("nome"),
      ]);
      setRows(a ?? []);
      setProjetos(p ?? []);
      setProfessores(prof ?? []);
      // Conta inscritos por atividade
      const ids = (a ?? []).map((x) => x.id);
      if (ids.length) {
        const { data: ins } = await supabase
          .from("atividade_inscritos")
          .select("atividade_id")
          .in("atividade_id", ids)
          .eq("status", "inscrito");
        const c: Record<string, number> = {};
        (ins ?? []).forEach((i: any) => { c[i.atividade_id] = (c[i.atividade_id] ?? 0) + 1; });
        setCounts(c);
      }
      setLoading(false);
    })();
  }, []);

  const projMap = useMemo(() => Object.fromEntries(projetos.map((p) => [p.id, p])), [projetos]);
  const profMap = useMemo(() => Object.fromEntries(professores.map((p) => [p.id, p])), [professores]);
  const cidades = useMemo(
    () => Array.from(new Set(projetos.map((p) => p.cidade).filter(Boolean))).sort(),
    [projetos]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (q && !r.titulo?.toLowerCase().includes(q.toLowerCase())) return false;
      if (fProj !== ALL && r.projeto_id !== fProj) return false;
      if (fMod !== ALL && r.tipo !== fMod) return false;
      if (fProf !== ALL && r.facilitador_id !== fProf) return false;
      if (fStatus !== ALL && r.status !== fStatus) return false;
      if (fCidade !== ALL) {
        const proj = r.projeto_id ? projMap[r.projeto_id] : null;
        if (proj?.cidade !== fCidade) return false;
      }
      if (fIni && r.data && r.data < fIni) return false;
      if (fFim && r.data && r.data > fFim) return false;
      return true;
    });
  }, [rows, q, fProj, fMod, fProf, fStatus, fCidade, fIni, fFim, projMap]);

  const limpar = () => {
    setQ(""); setFProj(ALL); setFCidade(ALL); setFMod(ALL); setFProf(ALL);
    setFStatus(ALL); setFIni(""); setFFim("");
  };

  const hasFiltro = q || fProj !== ALL || fCidade !== ALL || fMod !== ALL ||
    fProf !== ALL || fStatus !== ALL || fIni || fFim;

  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">Início › Atividades</nav>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Atividades</h1>
        {canEdit && (
          <Button asChild size="lg" className="md:size-default">
            <Link to="/atividades/novo"><Plus className="w-4 h-4 mr-1" /> Nova atividade</Link>
          </Button>
        )}
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-4 mb-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Buscar pelo nome da atividade..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FiltroSelect label="Projeto" value={fProj} onChange={setFProj}
            options={[{ v: ALL, l: "Todos" }, ...projetos.map((p) => ({ v: p.id, l: p.titulo }))]} />
          <FiltroSelect label="Polo / Cidade" value={fCidade} onChange={setFCidade}
            options={[{ v: ALL, l: "Todas" }, ...cidades.map((c) => ({ v: c, l: c }))]} />
          <FiltroSelect label="Modalidade" value={fMod} onChange={setFMod}
            options={[{ v: ALL, l: "Todas" }, ...MODALIDADES.map((m) => ({ v: m, l: m }))]} />
          <FiltroSelect label="Professor" value={fProf} onChange={setFProf}
            options={[{ v: ALL, l: "Todos" }, ...professores.map((p) => ({ v: p.id, l: p.nome }))]} />
          <FiltroSelect label="Status" value={fStatus} onChange={setFStatus}
            options={[{ v: ALL, l: "Todos" }, ...STATUS_OPTS.map((s) => ({ v: s.v, l: s.l }))]} />
          <div>
            <label className="text-xs uppercase text-muted-foreground">De</label>
            <Input type="date" value={fIni} onChange={(e) => setFIni(e.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">Até</label>
            <Input type="date" value={fFim} onChange={(e) => setFFim(e.target.value)} />
          </div>
          {hasFiltro && (
            <div className="flex items-end">
              <Button variant="ghost" onClick={limpar} className="w-full">
                <X className="w-4 h-4 mr-1" /> Limpar filtros
              </Button>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Mostrando {filtered.length} de {rows.length} atividade(s)
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atividade</TableHead>
                <TableHead className="hidden md:table-cell">Projeto</TableHead>
                <TableHead className="hidden lg:table-cell">Modalidade</TableHead>
                <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                <TableHead className="hidden xl:table-cell">Professor</TableHead>
                <TableHead className="hidden md:table-cell">Horário</TableHead>
                <TableHead className="text-center">Inscritos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma atividade encontrada.</TableCell></TableRow>
              )}
              {!loading && filtered.map((r) => {
                const proj = r.projeto_id ? projMap[r.projeto_id] : null;
                const prof = r.facilitador_id ? profMap[r.facilitador_id] : null;
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => nav({ to: "/atividades/$id", params: { id: r.id } })}>
                    <TableCell className="font-medium">
                      <div>{r.titulo}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{proj?.titulo ?? "—"} · {r.tipo ?? "—"}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{proj?.titulo ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{r.tipo ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{proj?.cidade ?? "—"}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm">{prof?.nome ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm whitespace-nowrap">
                      {r.horario_inicio ? `${r.horario_inicio.slice(0, 5)}${r.horario_fim ? `–${r.horario_fim.slice(0, 5)}` : ""}` : "—"}
                    </TableCell>
                    <TableCell className="text-center">{counts[r.id] ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="Ver">
                          <Link to="/atividades/$id" params={{ id: r.id }}><Eye className="w-4 h-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Chamada">
                          <Link to="/atividades/$id" params={{ id: r.id }} hash="chamada"><ClipboardList className="w-4 h-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Relatório">
                          <Link to="/atividades/$id/relatorio" params={{ id: r.id }}><FileBarChart className="w-4 h-4" /></Link>
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="icon" asChild title="Editar">
                            <Link to="/atividades/$id/editar" params={{ id: r.id }}><Pencil className="w-4 h-4" /></Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

function FiltroSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <label className="text-xs uppercase text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
