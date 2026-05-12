import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { PageHeader } from "@/components/AppLayout";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import {
  createUser, updateUser, setUserStatus, deleteUser,
} from "@/lib/admin-users.functions";
import { toast } from "sonner";
import { UserPlus, Pencil, Trash2, ShieldCheck, ShieldOff, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_app/configuracoes/")({
  component: Config,
});

const ROLES = ["administrador", "coordenador", "professor", "colaborador", "consulta"] as const;
type Role = typeof ROLES[number];
const STATUS_LABEL: Record<string, string> = {
  aprovado: "Ativo",
  pendente: "Pendente",
  bloqueado: "Inativo",
};

type UserRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  status: string;
  created_at: string;
  role: Role | null;
};

function Config() {
  const { hasRole, profile, user } = useAuth();
  const isAdmin = hasRole("administrador");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  async function load() {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,nome,email,telefone,status,created_at")
      .order("nome");
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const map: Record<string, Role> = {};
    (roles ?? []).forEach((r: any) => { map[r.user_id] = r.role; });
    setUsers((profiles ?? []).map((p: any) => ({ ...p, role: map[p.id] ?? null })));
  }

  if (!isAdmin) {
    return (
      <>
        <PageHeader breadcrumb={["Início", "Configurações"]} title="Configurações" />
        <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
          <h2 className="font-semibold mb-2">Sua conta</h2>
          <p className="text-sm"><span className="text-muted-foreground">Nome:</span> {profile?.nome}</p>
          <p className="text-sm"><span className="text-muted-foreground">E-mail:</span> {profile?.email}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para gerenciar usuários do sistema.
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader breadcrumb={["Início", "Configurações"]} title="Configurações" />

      <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-semibold mb-2">Sua conta</h2>
        <p className="text-sm"><span className="text-muted-foreground">Nome:</span> {profile?.nome}</p>
        <p className="text-sm"><span className="text-muted-foreground">E-mail:</span> {profile?.email}</p>
      </div>

      <div className="bg-card border rounded-xl shadow-sm">
        <div className="px-5 py-3 border-b flex items-center justify-between gap-2">
          <span className="font-semibold">Usuários e perfis</span>
          <Button size="sm" onClick={() => setOpenNew(true)}>
            <UserPlus className="w-4 h-4 mr-1" /> Novo usuário
          </Button>
        </div>

        {/* Tabela (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Telefone</th>
                <th className="px-4 py-2">Perfil</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Cadastro</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRowDesktop
                  key={u.id}
                  u={u}
                  selfId={user?.id ?? ""}
                  onEdit={() => setEditing(u)}
                  onDelete={() => setConfirmDelete(u)}
                  onChanged={load}
                />
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Nenhum usuário cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y">
          {users.map((u) => (
            <UserCardMobile
              key={u.id}
              u={u}
              selfId={user?.id ?? ""}
              onEdit={() => setEditing(u)}
              onDelete={() => setConfirmDelete(u)}
              onChanged={load}
            />
          ))}
          {users.length === 0 && (
            <p className="px-4 py-6 text-center text-muted-foreground text-sm">Nenhum usuário cadastrado.</p>
          )}
        </div>
      </div>

      <NovoUsuarioDialog open={openNew} onOpenChange={setOpenNew} onCreated={load} />
      <EditarUsuarioDialog user={editing} onOpenChange={(v) => !v && setEditing(null)} onSaved={load} />
      <ConfirmDeleteDialog
        user={confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        onDeleted={load}
      />
    </>
  );
}

// ---------- Subcomponents ----------
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    aprovado: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pendente: "bg-amber-100 text-amber-700 border-amber-200",
    bloqueado: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <Badge variant="outline" className={map[status] ?? ""}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function ActionButtons({
  u, selfId, onEdit, onDelete, onChanged,
}: {
  u: UserRow; selfId: string;
  onEdit: () => void; onDelete: () => void; onChanged: () => void;
}) {
  const setStatus = useServerFn(setUserStatus);
  const isSelf = u.id === selfId;

  async function changeStatus(s: "aprovado" | "bloqueado") {
    try {
      await setStatus({ data: { id: u.id, status: s } });
      toast.success(s === "aprovado" ? "Usuário reativado." : "Usuário inativado.");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível realizar esta ação. Tente novamente.");
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button size="icon" variant="ghost" title="Editar" onClick={onEdit}>
        <Pencil className="w-4 h-4" />
      </Button>
      {u.status === "aprovado" ? (
        <Button size="icon" variant="ghost" title="Inativar" disabled={isSelf}
          onClick={() => changeStatus("bloqueado")}>
          <ShieldOff className="w-4 h-4" />
        </Button>
      ) : (
        <Button size="icon" variant="ghost" title={u.status === "pendente" ? "Aprovar" : "Reativar"}
          onClick={() => changeStatus("aprovado")}>
          {u.status === "pendente" ? <ShieldCheck className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
        </Button>
      )}
      <Button size="icon" variant="ghost" title="Excluir" disabled={isSelf}
        onClick={onDelete} className="text-red-600 hover:text-red-700">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function UserRowDesktop(props: {
  u: UserRow; selfId: string;
  onEdit: () => void; onDelete: () => void; onChanged: () => void;
}) {
  const { u } = props;
  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{u.nome}</td>
      <td className="px-4 py-2">{u.email}</td>
      <td className="px-4 py-2">{u.telefone || "—"}</td>
      <td className="px-4 py-2">{u.role ? ROLE_LABELS[u.role] : "—"}</td>
      <td className="px-4 py-2"><StatusBadge status={u.status} /></td>
      <td className="px-4 py-2 text-muted-foreground">
        {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}
      </td>
      <td className="px-4 py-2"><ActionButtons {...props} /></td>
    </tr>
  );
}

function UserCardMobile(props: {
  u: UserRow; selfId: string;
  onEdit: () => void; onDelete: () => void; onChanged: () => void;
}) {
  const { u } = props;
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{u.nome}</div>
          <div className="text-xs text-muted-foreground">{u.email}</div>
        </div>
        <StatusBadge status={u.status} />
      </div>
      <div className="text-sm text-muted-foreground">
        {u.telefone || "Sem telefone"} · {u.role ? ROLE_LABELS[u.role] : "Sem perfil"}
      </div>
      <div className="text-xs text-muted-foreground">
        Cadastro: {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}
      </div>
      <ActionButtons {...props} />
    </div>
  );
}

// ---------- Novo usuário ----------
function NovoUsuarioDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const create = useServerFn(createUser);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("colaborador");
  const [status, setStatus] = useState<"aprovado" | "bloqueado">("aprovado");
  const [loading, setLoading] = useState(false);

  function reset() {
    setNome(""); setEmail(""); setTelefone("");
    setPassword(""); setConfirm("");
    setRole("colaborador"); setStatus("aprovado");
  }

  function genPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let p = "";
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
    const pw = p + "!";
    setPassword(pw); setConfirm(pw);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("As senhas não coincidem."); return; }
    if (password.length < 8) { toast.error("A senha deve ter ao menos 8 caracteres."); return; }
    setLoading(true);
    try {
      await create({ data: { nome, email, telefone, password, role, status } });
      toast.success("Usuário cadastrado com sucesso.");
      reset(); onOpenChange(false); onCreated();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Não foi possível realizar esta ação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Cadastrar novo usuário</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Nome completo *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>E-mail *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={40} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Perfil *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprovado">Ativo</SelectItem>
                  <SelectItem value="bloqueado">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Senha temporária *</Label>
            <div className="flex gap-2">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} />
              <Button type="button" variant="outline" onClick={genPassword}>Gerar</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo 8 caracteres. Compartilhe com o usuário com segurança.
            </p>
          </div>
          <div>
            <Label>Confirmar senha *</Label>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} maxLength={72} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar usuário"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Editar usuário ----------
function EditarUsuarioDialog({
  user, onOpenChange, onSaved,
}: { user: UserRow | null; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const update = useServerFn(updateUser);
  const open = !!user;
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [role, setRole] = useState<Role>("colaborador");
  const [status, setStatus] = useState<string>("aprovado");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setTelefone(user.telefone ?? "");
      setRole(user.role ?? "colaborador");
      setStatus(user.status);
    }
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await update({ data: { id: user.id, nome, telefone, role, status: status as any } });
      toast.success("Usuário atualizado com sucesso.");
      onOpenChange(false); onSaved();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Não foi possível realizar esta ação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar usuário</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Nome completo *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} />
          </div>
          <div>
            <Label>E-mail (não editável)</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={40} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Perfil *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprovado">Ativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="bloqueado">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar alterações"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Excluir usuário ----------
function ConfirmDeleteDialog({
  user, onOpenChange, onDeleted,
}: { user: UserRow | null; onOpenChange: (v: boolean) => void; onDeleted: () => void }) {
  const del = useServerFn(deleteUser);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    if (!user) return;
    setLoading(true);
    try {
      await del({ data: { id: user.id } });
      toast.success("Usuário excluído com sucesso.");
      onOpenChange(false); onDeleted();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Não foi possível realizar esta ação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={!!user} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <span className="font-medium">{user?.nome}</span>?
            Esta ação não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
