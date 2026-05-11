import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ENCONTRO_STATUS, statusEncontroLabel, statusEncontroColor } from "@/lib/atividades";
import { Plus, Trash2, ClipboardEdit } from "lucide-react";
import { RegistrarEncontroDialog } from "./RegistrarEncontroDialog";
import { toast } from "sonner";

interface Props {
  atividadeId: string;
  controlePresenca: boolean;
  canEdit: boolean;
}

export function CalendarioEncontros({ atividadeId, controlePresenca, canEdit }: Props) {
  const [encontros, setEncontros] = useState<any[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  async function load() {
    const { data } = await supabase
      .from("encontros_atividade")
      .select("*")
      .eq("atividade_id", atividadeId)
      .order("data", { ascending: true });
    setEncontros(data ?? []);
    setSel(new Set());
  }

  useEffect(() => { load(); }, [atividadeId]);

  async function delSelecionados() {
    if (!sel.size) return;
    if (!confirm(`Excluir ${sel.size} encontro(s) selecionado(s)?`)) return;
    const { error } = await supabase.from("encontros_atividade").delete().in("id", Array.from(sel));
    if (error) toast.error(error.message);
    else { toast.success("Encontros excluídos."); load(); }
  }

  function abrirNovo() {
    setEditing(null);
    setOpenDialog(true);
  }

  function abrirRegistrar(e: any) {
    setEditing(e);
    setOpenDialog(true);
  }

  const realizadas = encontros.filter((e) => e.status === "realizada").length;
  const total = encontros.length;

  return (
    <div className="bg-card border rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold">Calendário de aulas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Encontros registrados {realizadas} de {total}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2 flex-wrap">
            {sel.size > 0 && (
              <Button variant="destructive" size="sm" onClick={delSelecionados}>
                <Trash2 className="w-4 h-4 mr-1" /> Excluir ({sel.size})
              </Button>
            )}
            <Button size="sm" onClick={abrirNovo}><Plus className="w-4 h-4 mr-1" /> Novo encontro</Button>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="px-4 py-2 border-b flex flex-wrap gap-3 text-xs">
        {ENCONTRO_STATUS.map((s) => (
          <span key={s.value} className={`px-2 py-0.5 rounded border ${s.color}`}>{s.label}</span>
        ))}
      </div>

      {encontros.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhum encontro cadastrado ainda. {canEdit && "Clique em 'Novo encontro' para criar."}
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 w-10"></th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Horário</th>
                  <th className="px-3 py-2">Período</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {encontros.map((e) => (
                  <tr key={e.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2">
                      {canEdit && (
                        <Checkbox checked={sel.has(e.id)} onCheckedChange={(c) => {
                          const ns = new Set(sel);
                          c ? ns.add(e.id) : ns.delete(e.id);
                          setSel(ns);
                        }} />
                      )}
                    </td>
                    <td className="px-3 py-2">{new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                    <td className="px-3 py-2">{e.horario_inicio ? `${e.horario_inicio?.slice(0, 5)} - ${e.horario_fim?.slice(0, 5) ?? ""}` : "—"}</td>
                    <td className="px-3 py-2 capitalize">{e.periodo ?? "—"}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded border text-xs ${statusEncontroColor(e.status)}`}>{statusEncontroLabel(e.status)}</span></td>
                    <td className="px-3 py-2 text-right">
                      {canEdit && (
                        <Button size="sm" variant="outline" onClick={() => abrirRegistrar(e)}>
                          <ClipboardEdit className="w-4 h-4 mr-1" /> Registrar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {encontros.map((e) => (
              <div key={e.id} className="p-3 flex items-start gap-2">
                {canEdit && (
                  <Checkbox checked={sel.has(e.id)} onCheckedChange={(c) => {
                    const ns = new Set(sel);
                    c ? ns.add(e.id) : ns.delete(e.id);
                    setSel(ns);
                  }} />
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">{new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR")}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.horario_inicio ? `${e.horario_inicio?.slice(0, 5)} - ${e.horario_fim?.slice(0, 5) ?? ""}` : "Sem horário"}
                    {e.periodo && ` • ${e.periodo}`}
                  </div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded border text-xs ${statusEncontroColor(e.status)}`}>{statusEncontroLabel(e.status)}</span>
                </div>
                {canEdit && (
                  <Button size="sm" variant="outline" onClick={() => abrirRegistrar(e)}>
                    Registrar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <RegistrarEncontroDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        atividadeId={atividadeId}
        encontro={editing}
        controlePresenca={controlePresenca}
        reload={load}
      />
    </div>
  );
}
