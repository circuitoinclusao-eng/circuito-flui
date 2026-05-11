import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileDown, Filter, Eye, EyeOff, Search, MoreVertical, Tag, Users as UsersIcon } from "lucide-react";
import { ATENDIDO_STATUS, calcularIdade, hideCPF, maskCPF, statusClass, statusLabel, MARCADORES_PADRAO } from "@/lib/atendidos";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ImportarAtendidosDialog } from "@/components/atendidos/ImportarAtendidosDialog";

export const Route = createFileRoute("/_app/atendidos/")({ component: ListaAtendidos });

const COLUNAS = [
  { key: "foto", label: "Foto" },
  { key: "nome", label: "Nome" },
  { key: "status", label: "Situação" },
  { key: "marcadores", label: "Marcadores" },
  { key: "matricula_familia", label: "Matrícula família" },
  { key: "data_nascimento", label: "Nascimento" },
  { key: "idade", label: "Idade" },
  { key: "cpf", label: "CPF" },
  { key: "telefone", label: "Telefone" },
  { key: "cidade", label: "Cidade" },
  { key: "responsavel_nome", label: "Responsável" },
  { key: "projeto", label: "Projeto" },
  { key: "grupo", label: "Grupo / Turma" },
];

function ListaAtendidos() {
  const { canEdit } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [marcadoresMap, setMarcadoresMap] = useState<Record<string, string[]>>({});
  const [vincMap, setVincMap] = useState<Record<string, { projeto?: string; grupo?: string }>>({});
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<any>({});
  const [showFiltros, setShowFiltros] = useState(false);
  const [showCPF, setShowCPF] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [cols, setCols] = useState<string[]>(["foto", "nome", "status", "matricula_familia", "idade", "cpf", "telefone", "cidade", "projeto"]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  async function load() {
    const { data } = await supabase.from("atendidos").select("*").order("nome");
    setRows(data ?? []);
    const ids = (data ?? []).map((r) => r.id);
    if (ids.length) {
      const [{ data: marc }, { data: vinc }] = await Promise.all([
        supabase.from("atendido_marcadores").select("atendido_id,marcador").in("atendido_id", ids),
        supabase.from("atendido_projetos").select("atendido_id,projeto_id,grupo_id,projetos(titulo),grupos(nome)").in("atendido_id", ids),
      ]);
      const mm: Record<string, string[]> = {};
      (marc ?? []).forEach((m: any) => { (mm[m.atendido_id] ??= []).push(m.marcador); });
      setMarcadoresMap(mm);
      const vm: Record<string, any> = {};
      (vinc ?? []).forEach((v: any) => {
        if (!vm[v.atendido_id]) vm[v.atendido_id] = { projeto: v.projetos?.titulo, grupo: v.grupos?.nome };
      });
      setVincMap(vm);
    }
  }
  useEffect(() => {
    load();
    supabase.from("projetos").select("id,titulo").order("titulo").then(({ data }) => setProjetos(data ?? []));
    supabase.from("grupos").select("id,nome").order("nome").then(({ data }) => setGrupos(data ?? []));
  }, []);

  const filtered = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return rows.filter((r) => {
      if (q) {
        const hay = [r.nome, r.cpf, r.matricula, r.telefone, r.responsavel_nome, vincMap[r.id]?.projeto].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filtros.status && r.status !== filtros.status) return false;
      if (filtros.cidade && (r.cidade ?? "").toLowerCase() !== filtros.cidade.toLowerCase()) return false;
      if (filtros.pcd && r.pessoa_com_deficiencia !== filtros.pcd) return false;
      if (filtros.marcador && !(marcadoresMap[r.id] ?? []).includes(filtros.marcador)) return false;
      if (filtros.faixa) {
        const i = calcularIdade(r.data_nascimento);
        if (i == null) return false;
        const [a, b] = filtros.faixa.split("-").map(Number);
        if (i < a || i > b) return false;
      }
      return true;
    });
  }, [rows, busca, filtros, marcadoresMap, vincMap]);

  function toggleSel(id: string) {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
  }
  function toggleAll() {
    if (sel.size === filtered.length) setSel(new Set());
    else setSel(new Set(filtered.map((r) => r.id)));
  }

  async function aplicarMarcadorMassa() {
    const m = prompt("Marcador a aplicar nos selecionados:");
    if (!m?.trim()) return;
    const inserts = Array.from(sel).map((atendido_id) => ({ atendido_id, marcador: m.trim() }));
    const { error } = await supabase.from("atendido_marcadores").upsert(inserts, { onConflict: "atendido_id,marcador" });
    if (error) toast.error(error.message); else { toast.success("Marcador aplicado."); load(); setSel(new Set()); }
  }
  async function adicionarAGrupoMassa() {
    if (!grupos.length) return toast.error("Cadastre grupos primeiro.");
    const id = prompt(`Cole o ID do grupo. Disponíveis:\n${grupos.map((g) => `${g.nome} → ${g.id}`).join("\n")}`);
    if (!id) return;
    const inserts = Array.from(sel).map((atendido_id) => ({ atendido_id, grupo_id: id, status: "ativo", data_entrada: new Date().toISOString().slice(0, 10) }));
    const { error } = await supabase.from("atendido_projetos").insert(inserts);
    if (error) toast.error(error.message); else { toast.success("Adicionados ao grupo."); load(); setSel(new Set()); }
  }

  function exportCSV() {
    const headers = ["matricula", "nome", "status", "data_nascimento", "idade", "cpf", "telefone", "cidade", "responsavel_nome", "projeto", "grupo"];
    const lines = [headers.join(",")];
    filtered.forEach((r) => {
      lines.push(headers.map((h) => {
        let val: any = r[h];
        if (h === "idade") val = calcularIdade(r.data_nascimento);
        if (h === "projeto") val = vincMap[r.id]?.projeto ?? "";
        if (h === "grupo") val = vincMap[r.id]?.grupo ?? "";
        return `"${String(val ?? "").replace(/"/g, '""')}"`;
      }).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u; a.download = `atendidos-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(u);
  }




  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">Início › Atendidos › Listagem</nav>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Listagem de atendidos</h1>
        <div className="flex flex-wrap gap-2">
          {canEdit && <Button asChild><Link to="/atendidos/novo"><Plus className="w-4 h-4 mr-1" /> Novo Atendido</Link></Button>}
          <Button variant="outline" onClick={exportCSV}><FileDown className="w-4 h-4 mr-1" /> Exportar</Button>
          {canEdit && (
            <label className="inline-flex items-center px-3 h-9 text-sm border rounded-md cursor-pointer hover:bg-accent">
              Importar CSV
              <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
            </label>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card border rounded-xl p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, CPF, matrícula, telefone, projeto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFiltros(!showFiltros)}><Filter className="w-4 h-4 mr-1" /> Filtros</Button>
        <Button variant="outline" size="sm" onClick={() => setShowCPF(!showCPF)}>
          {showCPF ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
          {showCPF ? "Ocultar CPF" : "Mostrar CPF"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Adicionar colunas</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUNAS.map((c) => (
              <DropdownMenuCheckboxItem key={c.key} checked={cols.includes(c.key)}
                onCheckedChange={(v) => setCols(v ? [...cols, c.key] : cols.filter((x) => x !== c.key))}>
                {c.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showFiltros && (
        <div className="bg-card border rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <FilterSelect label="Status" value={filtros.status} onChange={(v) => setFiltros({ ...filtros, status: v })} options={ATENDIDO_STATUS} />
          <FilterSelect label="PCD" value={filtros.pcd} onChange={(v) => setFiltros({ ...filtros, pcd: v })} options={[{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }, { value: "nao_informado", label: "Não informado" }]} />
          <FilterSelect label="Faixa etária" value={filtros.faixa} onChange={(v) => setFiltros({ ...filtros, faixa: v })} options={[{ value: "0-12", label: "0-12" }, { value: "13-17", label: "13-17" }, { value: "18-29", label: "18-29" }, { value: "30-59", label: "30-59" }, { value: "60-120", label: "60+" }]} />
          <FilterSelect label="Marcador" value={filtros.marcador} onChange={(v) => setFiltros({ ...filtros, marcador: v })} options={MARCADORES_PADRAO.map((m) => ({ value: m, label: m }))} />
          <div className="col-span-full">
            <Button variant="ghost" size="sm" onClick={() => setFiltros({})}>Limpar filtros</Button>
          </div>
        </div>
      )}

      {/* Ações em massa */}
      {sel.size > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-2 mb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm font-medium">{sel.size} selecionado{sel.size > 1 ? "s" : ""}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={aplicarMarcadorMassa}><Tag className="w-4 h-4 mr-1" /> Aplicar marcador</Button>
            <Button size="sm" variant="outline" onClick={adicionarAGrupoMassa}><UsersIcon className="w-4 h-4 mr-1" /> Adicionar a grupo</Button>
          </div>
        </div>
      )}

      {/* Tabela (desktop) */}
      <div className="hidden md:block bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3"><Checkbox checked={sel.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></th>
                {cols.includes("foto") && <th className="p-3 w-12"></th>}
                {cols.includes("nome") && <th className="p-3">Nome</th>}
                {cols.includes("status") && <th className="p-3">Situação</th>}
                {cols.includes("marcadores") && <th className="p-3">Marcadores</th>}
                {cols.includes("matricula_familia") && <th className="p-3">Família</th>}
                {cols.includes("data_nascimento") && <th className="p-3">Nasc.</th>}
                {cols.includes("idade") && <th className="p-3">Idade</th>}
                {cols.includes("cpf") && <th className="p-3">CPF</th>}
                {cols.includes("telefone") && <th className="p-3">Telefone</th>}
                {cols.includes("cidade") && <th className="p-3">Cidade</th>}
                {cols.includes("responsavel_nome") && <th className="p-3">Responsável</th>}
                {cols.includes("projeto") && <th className="p-3">Projeto</th>}
                {cols.includes("grupo") && <th className="p-3">Grupo</th>}
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr><td colSpan={cols.length + 3} className="p-8 text-center text-muted-foreground">Nenhum atendido encontrado.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="p-3"><Checkbox checked={sel.has(r.id)} onCheckedChange={() => toggleSel(r.id)} /></td>
                  {cols.includes("foto") && <td className="p-3">{r.foto_url ? <img src={r.foto_url} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">{r.nome?.[0]?.toUpperCase()}</div>}</td>}
                  {cols.includes("nome") && <td className="p-3"><Link to="/atendidos/$id" params={{ id: r.id }} className="font-medium hover:text-primary">{r.nome}</Link><div className="text-xs text-muted-foreground">{r.matricula}</div></td>}
                  {cols.includes("status") && <td className="p-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${statusClass(r.status)}`}>{statusLabel(r.status)}</span></td>}
                  {cols.includes("marcadores") && <td className="p-3"><div className="flex flex-wrap gap-1">{(marcadoresMap[r.id] ?? []).slice(0, 3).map((m) => <span key={m} className="text-[11px] bg-secondary px-1.5 py-0.5 rounded">{m}</span>)}</div></td>}
                  {cols.includes("matricula_familia") && <td className="p-3">{r.matricula_familia ?? "—"}</td>}
                  {cols.includes("data_nascimento") && <td className="p-3">{r.data_nascimento ? new Date(r.data_nascimento).toLocaleDateString("pt-BR") : "—"}</td>}
                  {cols.includes("idade") && <td className="p-3">{calcularIdade(r.data_nascimento) ?? "—"}</td>}
                  {cols.includes("cpf") && <td className="p-3 font-mono text-xs">{showCPF ? maskCPF(r.cpf) : hideCPF(r.cpf)}</td>}
                  {cols.includes("telefone") && <td className="p-3">{r.telefone ?? "—"}</td>}
                  {cols.includes("cidade") && <td className="p-3">{r.cidade ?? "—"}</td>}
                  {cols.includes("responsavel_nome") && <td className="p-3">{r.responsavel_nome ?? "—"}</td>}
                  {cols.includes("projeto") && <td className="p-3">{vincMap[r.id]?.projeto ?? "—"}</td>}
                  {cols.includes("grupo") && <td className="p-3">{vincMap[r.id]?.grupo ?? "—"}</td>}
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link to="/atendidos/$id" params={{ id: r.id }}>Ver ficha</Link></DropdownMenuItem>
                        {canEdit && <DropdownMenuItem asChild><Link to="/atendidos/$id/editar" params={{ id: r.id }}>Editar</Link></DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && <div className="text-center text-muted-foreground py-8">Nenhum atendido encontrado.</div>}
        {filtered.map((r) => (
          <div key={r.id} className="bg-card border rounded-xl p-4 flex gap-3">
            <Checkbox checked={sel.has(r.id)} onCheckedChange={() => toggleSel(r.id)} />
            {r.foto_url
              ? <img src={r.foto_url} className="w-12 h-12 rounded-full object-cover" />
              : <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">{r.nome?.[0]?.toUpperCase()}</div>}
            <div className="flex-1 min-w-0">
              <Link to="/atendidos/$id" params={{ id: r.id }} className="font-semibold hover:text-primary block truncate">{r.nome}</Link>
              <div className="text-xs text-muted-foreground">{r.matricula} • {calcularIdade(r.data_nascimento) ?? "—"} anos</div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] ${statusClass(r.status)}`}>{statusLabel(r.status)}</span>
                {vincMap[r.id]?.projeto && <span className="text-[11px] text-muted-foreground">{vincMap[r.id].projeto}</span>}
              </div>
              {r.telefone && <div className="text-xs mt-1">{r.telefone}</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: any; onChange: (v: string | null) => void; options: ReadonlyArray<{ value: string; label: string }> }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <Select value={value ?? "__all"} onValueChange={(v) => onChange(v === "__all" ? null : v)}>
        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">Todos</SelectItem>
          {options.map((o: any) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
