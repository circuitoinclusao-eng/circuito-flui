import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Edit, Plus, UserX } from "lucide-react";

export const Route = createFileRoute("/_app/configuracoes/")({
  component: Config,
});

const ROLES = ["administrador", "coordenador", "colaborador", "consulta"] as const;
const STATUS = ["ativo", "inativo"] as const;

type Perfil = typeof ROLES[number];
type StatusUsuario = typeof STATUS[number];

const emptyForm = {
  nome: "",
  email: "",
  telefone: "",
  perfil: "colaborador" as Perfil,
  status: "ativo" as StatusUsuario,
  senhaTemporaria: "",
  confirmarSenha: "",
};

function Config() {
  const { hasRole, profile } = useAuth();
  const isAdmin = hasRole("administrador");
  const [users, setUsers] = useState<any[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const adminCount = useMemo(
    () => users.filter((u) => u.status !== "inativo" && (u.roles?.[0]?.role === "administrador")).length,
    [users],
  );

  async function load() {
    const { data: profiles } = await supabase.from("profiles").select("*").order("nome");
    const { data: roles } = await supabase.from("user_roles").select("user_id,role,id");
    const map: Record<string, any[]> = {};
    (roles ?? []).forEach((r: any) => { (map[r.user_id] ||= []).push(r); });
    setUsers((profiles ?? []).map((p: any) => ({
      ...p,
      status: p.status ?? (p.ativo ? "ativo" : "inativo"),
      roles: map[p.id] ?? [],
    })));
  }

  function setField(k: keyof typeof emptyForm, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function openNew() {
    setForm(emptyForm);
    setOpenCreate(true);
  }

  function openEdit(user: any) {
    const perfil = (user.roles?.[0]?.role ?? "colaborador") as Perfil;
    setForm({
      nome: user.nome ?? "",
      email: user.email ?? "",
      telefone: user.telefone ?? "",
      perfil,
      status: (user.status ?? (user.ativo ? "ativo" : "inativo")) as StatusUsuario,
      senhaTemporaria: "",
      confirmarSenha: "",
    });
    setEditing(user);
  }

  function isLastAdminTarget(user: any, nextPerfil?: string, nextStatus?: string) {
    const currentPerfil = user.roles?.[0]?.role;
    const currentStatus = user.status ?? (user.ativo ? "ativo" : "inativo");
    if (currentPerfil !== "administrador" || currentStatus === "inativo") return false;
    if (adminCount > 1) return false;
    return nextPerfil !== "administrador" || nextStatus === "inativo";
  }

  async function createUser() {
    if (!form.nome.trim() || !form.email.trim() || !form.senhaTemporaria) {
      toast.error("Preencha nome, e-mail e senha temporária.");
      return;
    }
    if (form.senhaTemporaria !== form.confirmarSenha) {
      toast.error("As senhas não conferem.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.functions.invoke("create-user", {
      body: {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        perfil: form.perfil,
        status: form.status,
        senhaTemporaria: form.senhaTemporaria,
      },
    });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível realizar esta ação. Tente novamente.");
      return;
    }
    toast.success("Usuário cadastrado com sucesso.");
    setOpenCreate(false);
    load();
  }

  async function updateUser() {
    if (!editing) return;
    if (isLastAdminTarget(editing, form.perfil, form.status)) {
      toast.error("Não é possível alterar o último administrador ativo.");
      return;
    }
    setBusy(true);
    const { error: pErr } = await supabase.from("profiles").update({
      nome: form.nome,
      telefone: form.telefone || null,
      status: form.status,
      ativo: form.status === "ativo",
    } as any).eq("id", editing.id);

    if (!pErr) {
      const current = editing.roles?.[0];
      if (current?.id) await supabase.from("user_roles").delete().eq("id", current.id);
      const { error: rErr } = await supabase.from("user_roles").insert({ user_id: editing.id, role: form.perfil as any });
      if (rErr) {
        setBusy(false);
        toast.error("Não foi possível realizar esta ação. Tente novamente.");
        return;
      }
    }

    setBusy(false);
    if (pErr) {
      toast.error("Não foi possível realizar esta ação. Tente novamente.");
      return;
    }
    toast.success("Usuário atualizado com sucesso.");
    setEditing(null);
    load();
  }

  async function inativar(user: any) {
    if (isLastAdminTarget(user, user.roles?.[0]?.role, "inativo")) {
      toast.error("Não é possível inativar o último administrador ativo.");
      return;
    }
    const { error } = await supabase.from("profiles").update({ status: "inativo", ativo: false } as any).eq("id", user.id);
    if (error) toast.error("Não foi possível realizar esta ação. Tente novamente.");
    else {
      toast.success("Usuário inativado com sucesso.");
      load();
    }
  }

  return (
    <>
      <PageHeader breadcrumb={["Início", "Configurações"]} title="Configurações" />

      <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-semibold mb-2">Sua conta</h2>
        <p className="text-sm"><span className="text-muted-foreground">Nome:</span> {profile?.nome}</p>
        <p className="text-sm"><span className="text-muted-foreground">E-mail:</span> {profile?.email}</p>
      </div>

      {!isAdmin ? (
        <p className="text-sm text-muted-foreground">Você não tem permissão para acessar esta área.</p>
      ) : (
        <div className="bg-card border rounded-xl shadow-sm">
          <div className="px-5 py-3 border-b flex items-center justify-between gap-2">
            <h2 className="font-semibold">Usuários e perfis</h2>
            <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo usuário</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2">Nome</th>
                  <th className="text-left px-4 py-2">E-mail</th>
                  <th className="text-left px-4 py-2">Telefone</th>
                  <th className="text-left px-4 py-2">Perfil</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const cur = u.roles?.[0];
                  const status = u.status ?? (u.ativo ? "ativo" : "inativo");
                  return (
                    <tr key={u.id} className="border-t">
                      <td className="px-4 py-2 font-medium">{u.nome}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">{u.telefone ?? "—"}</td>
                      <td className="px-4 py-2">{ROLE_LABELS[cur?.role as Perfil] ?? "—"}</td>
                      <td className="px-4 py-2">{status === "ativo" ? "Ativo" : "Inativo"}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                            <Edit className="w-4 h-4 mr-1" /> Editar
                          </Button>
                          {status !== "inativo" && (
                            <Button variant="ghost" size="sm" onClick={() => inativar(u)}>
                              <UserX className="w-4 h-4 mr-1" /> Inativar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UserDialog
        title="Cadastrar novo usuário"
        open={openCreate}
        form={form}
        busy={busy}
        includePassword
        onClose={() => setOpenCreate(false)}
        onChange={setField}
        onSubmit={createUser}
      />

      <UserDialog
        title="Editar usuário"
        open={!!editing}
        form={form}
        busy={busy}
        onClose={() => setEditing(null)}
        onChange={setField}
        onSubmit={updateUser}
      />
    </>
  );
}

function UserDialog({ title, open, form, busy, includePassword, onClose, onChange, onSubmit }: any) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          <div className="md:col-span-2">
            <Label>Nome completo</Label>
            <Input value={form.nome} onChange={(e) => onChange("nome", e.target.value)} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} disabled={!includePassword} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={(e) => onChange("telefone", e.target.value)} />
          </div>
          <div>
            <Label>Perfil</Label>
            <Select value={form.perfil} onValueChange={(v) => onChange("perfil", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => onChange("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {includePassword && (
            <>
              <div>
                <Label>Senha temporária</Label>
                <Input type="password" value={form.senhaTemporaria} onChange={(e) => onChange("senhaTemporaria", e.target.value)} />
              </div>
              <div>
                <Label>Confirmar senha</Label>
                <Input type="password" value={form.confirmarSenha} onChange={(e) => onChange("confirmarSenha", e.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
