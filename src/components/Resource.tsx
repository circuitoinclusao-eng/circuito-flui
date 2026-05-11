import { type ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/Cards";

export type FieldType = "text" | "textarea" | "number" | "date" | "time" | "select" | "email";
export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  full?: boolean;
}

interface ListProps {
  table: string;
  title: string;
  breadcrumb: string[];
  basePath: string;
  fields: Field[];
  listColumns: { key: string; label: string; render?: (v: any, row: any) => ReactNode }[];
  defaultOrder?: { col: string; ascending?: boolean };
}

export function ResourceList({ table, title, breadcrumb, basePath, listColumns, defaultOrder }: ListProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const { isAdminOrCoord, hasRole } = useAuth();
  const canCreate = isAdminOrCoord || hasRole("colaborador");

  useEffect(() => { load(); }, [table]);

  async function load() {
    setLoading(true);
    let query = supabase.from(table as any).select("*");
    if (defaultOrder) query = query.order(defaultOrder.col, { ascending: defaultOrder.ascending ?? false });
    else query = query.order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setRows((data as any[]) ?? []);
    setLoading(false);
  }

  async function remove(id: string) {
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Excluído."); load(); }
  }

  const filtered = rows.filter((r) =>
    !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <div className="mb-6">
        <nav className="text-xs text-muted-foreground mb-2">{breadcrumb.join("  ›  ")}</nav>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
          {canCreate && (
            <Button asChild>
              <Link to={`${basePath}/novo`}>+ Novo</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm">
        <div className="p-4 border-b">
          <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum registro. {canCreate && <Link to={`${basePath}/novo`} className="text-primary hover:underline">Criar primeiro</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {listColumns.map((c) => (
                    <th key={c.key} className="text-left font-medium px-4 py-2.5">{c.label}</th>
                  ))}
                  <th className="px-4 py-2.5 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted/30">
                    {listColumns.map((c, i) => (
                      <td key={c.key} className="px-4 py-3">
                        {i === 0 ? (
                          <Link to={`${basePath}/$id`} params={{ id: row.id }} className="font-medium hover:text-primary">
                            {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                          </Link>
                        ) : c.key === "status" ? (
                          <StatusBadge status={row[c.key]} />
                        ) : c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {isAdminOrCoord && (
                          <Button asChild variant="ghost" size="icon" className="w-8 h-8">
                            <Link to={`${basePath}/$id/editar`} params={{ id: row.id }}><Pencil className="w-4 h-4" /></Link>
                          </Button>
                        )}
                        {isAdminOrCoord && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(row.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

interface FormProps {
  table: string;
  title: string;
  breadcrumb: string[];
  basePath: string;
  fields: Field[];
  id?: string;
}

export function ResourceForm({ table, title, breadcrumb, basePath, fields, id }: FormProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const nav = useNavigate();

  useEffect(() => {
    if (!id) return;
    supabase.from(table as any).select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error) toast.error(error.message);
      else setValues(data as any ?? {});
      setLoading(false);
    });
  }, [id, table]);

  function set(name: string, v: any) { setValues((s) => ({ ...s, [name]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload: Record<string, any> = {};
    fields.forEach((f) => {
      let v = values[f.name];
      if (v === "" || v === undefined) v = null;
      if (f.type === "number" && v !== null) v = Number(v);
      payload[f.name] = v;
    });
    const op = id
      ? supabase.from(table as any).update(payload).eq("id", id)
      : supabase.from(table as any).insert(payload);
    const { error } = await op;
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Salvo."); nav({ to: basePath }); }
  }

  if (loading) return <div className="p-10 text-center text-muted-foreground text-sm">Carregando...</div>;

  return (
    <>
      <div className="mb-6">
        <nav className="text-xs text-muted-foreground mb-2">{breadcrumb.join("  ›  ")}</nav>
        <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
      </div>
      <form onSubmit={submit} className="bg-card border rounded-xl shadow-sm p-5 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.name} className={f.full || f.type === "textarea" ? "md:col-span-2" : ""}>
              <Label htmlFor={f.name}>{f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}</Label>
              {f.type === "textarea" ? (
                <Textarea id={f.name} required={f.required} value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} rows={4} />
              ) : f.type === "select" ? (
                <Select value={values[f.name] ?? ""} onValueChange={(v) => set(f.name, v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={f.name}
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "time" ? "time" : f.type === "email" ? "email" : "text"}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
          <Button type="button" variant="outline" onClick={() => nav({ to: basePath })}>Cancelar</Button>
        </div>
      </form>
    </>
  );
}
