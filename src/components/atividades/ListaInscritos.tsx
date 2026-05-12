import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileDown, Eye, Trash2, ArrowUpCircle, RotateCcw, User } from "lucide-react";
import { calcularIdade, downloadCSV } from "@/lib/atividades";
import { toast } from "sonner";

interface Props {
  atividadeId: string;
  canEdit: boolean;
  numeroVagas?: number | null;
}

export function ListaInscritos({ atividadeId, canEdit, numeroVagas }: Props) {
  const [insc, setInsc] = useState<any[]>([]);
  const [tab, setTab] = useState("inscrito");
  const [openAdd, setOpenAdd] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("atividade_inscritos")
      .select("id, status, data_inscricao, atendido_id, atendidos(id, nome, foto_url, data_nascimento)")
      .eq("atividade_id", atividadeId)
      .order("data_inscricao", { ascending: false });
    setInsc(data ?? []);
  }
  useEffect(() => { load(); }, [atividadeId]);

  const lista = insc.filter((i) => i.status === tab);

  async function mudarStatus(id: string, status: string) {
    await supabase.from("atividade_inscritos").update({ status }).eq("id", id);
    load();
  }

  async function remover(id: string) {
    if (!confirm("Remover inscrito?")) return;
    await supabase.from("atividade_inscritos").update({ status: "removido" }).eq("id", id);
    toast.success("Inscrito movido para removidos.");
    load();
  }

  function exportar() {
    const rows: (string | number | null)[][] = [["Nome", "Idade", "Status", "Data inscrição"]];
    lista.forEach((i) => {
      rows.push([
        i.atendidos?.nome ?? "",
        calcularIdade(i.atendidos?.data_nascimento) ?? "",
        i.status,
        i.data_inscricao ? new Date(i.data_inscricao).toLocaleDateString("pt-BR") : "",
      ]);
    });
    downloadCSV(`inscritos-${tab}.csv`, rows);
  }

  const counts = {
    inscrito: insc.filter((i) => i.status === "inscrito").length,
    espera: insc.filter((i) => i.status === "espera").length,
    removido: insc.filter((i) => i.status === "removido").length,
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold">Lista de inscritos</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportar}><FileDown className="w-4 h-4 mr-1" /> Gerar arquivo</Button>
          {canEdit && <Button size="sm" onClick={() => setOpenAdd(true)}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mx-4 mt-3">
          <TabsTrigger value="inscrito">Inscritos ({counts.inscrito}{numeroVagas ? `/${numeroVagas}` : ""})</TabsTrigger>
          <TabsTrigger value="espera">Em espera ({counts.espera})</TabsTrigger>
          <TabsTrigger value="removido">Removidos ({counts.removido})</TabsTrigger>
        </TabsList>

        {(["inscrito", "espera", "removido"] as const).map((t) => (
          <TabsContent key={t} value={t} className="mt-2">
            {lista.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum atendido nesta lista.</p>
            ) : (
              <ul className="divide-y">
                {lista.map((i) => {
                  const at = i.atendidos;
                  return (
                    <li key={i.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {at?.foto_url ? <img src={at.foto_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <div className="font-medium">{at?.nome ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {calcularIdade(at?.data_nascimento) != null && `${calcularIdade(at?.data_nascimento)} anos • `}
                          inscrito em {new Date(i.data_inscricao).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {at?.id && (
                          <Button asChild variant="outline" size="sm">
                            <Link to="/atendidos/$id" params={{ id: at.id }}><Eye className="w-4 h-4 mr-1" /> Detalhes</Link>
                          </Button>
                        )}
                        {canEdit && t === "espera" && (
                          <Button variant="outline" size="sm" onClick={() => mudarStatus(i.id, "inscrito")}>
                            <ArrowUpCircle className="w-4 h-4 mr-1" /> Promover
                          </Button>
                        )}
                        {canEdit && t === "removido" && (
                          <Button variant="outline" size="sm" onClick={() => mudarStatus(i.id, "inscrito")}>
                            <RotateCcw className="w-4 h-4 mr-1" /> Reativar
                          </Button>
                        )}
                        {canEdit && t !== "removido" && (
                          <Button variant="ghost" size="sm" onClick={() => remover(i.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <AddInscritoDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        atividadeId={atividadeId}
        existentes={new Set(insc.map((i) => i.atendido_id))}
        reload={load}
      />
    </div>
  );
}

function AddInscritoDialog({ open, onClose, atividadeId, existentes, reload }: any) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [statusInsc, setStatusInsc] = useState<"inscrito" | "espera">("inscrito");

  useEffect(() => {
    if (!open) return;
    let active = true;
    const t = setTimeout(async () => {
      let query = supabase.from("atendidos").select("id,nome,foto_url,data_nascimento").order("nome").limit(20);
      if (q.trim()) query = query.ilike("nome", `%${q}%`);
      const { data } = await query;
      if (active) setResults(data ?? []);
    }, 250);
    return () => { active = false; clearTimeout(t); };
  }, [q, open]);

  async function add(at: any) {
    const { error } = await supabase.from("atividade_inscritos").upsert({
      atividade_id: atividadeId,
      atendido_id: at.id,
      status: statusInsc,
      data_inscricao: new Date().toISOString().slice(0, 10),
    }, { onConflict: "atividade_id,atendido_id" });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${at.nome} adicionado(a).`);
    reload();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Adicionar inscritos</DialogTitle></DialogHeader>
        <div className="flex gap-2 items-center">
          <Input placeholder="Buscar atendido por nome..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
          <select value={statusInsc} onChange={(e) => setStatusInsc(e.target.value as any)} className="border rounded-md h-10 px-2 text-sm">
            <option value="inscrito">Inscrito</option>
            <option value="espera">Em espera</option>
          </select>
        </div>
        <ul className="divide-y border rounded-md mt-2">
          {results.map((at) => (
            <li key={at.id} className="p-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                {at.foto_url ? <img src={at.foto_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 text-sm">
                <div className="font-medium">{at.nome}</div>
                <div className="text-xs text-muted-foreground">{calcularIdade(at.data_nascimento) ?? "?"} anos</div>
              </div>
              <Button size="sm" variant={existentes.has(at.id) ? "outline" : "default"} onClick={() => add(at)}>
                {existentes.has(at.id) ? "Atualizar" : "Adicionar"}
              </Button>
            </li>
          ))}
          {results.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">Nenhum atendido encontrado.</li>}
        </ul>
        <DialogFooter><Button onClick={onClose}>Concluir</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
