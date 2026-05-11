import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { PageHeader } from "@/components/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracoes/")({
  component: Config,
});

const ROLES = ["administrador", "coordenador", "professor", "colaborador", "consulta"] as const;

function Config() {
  const { hasRole, profile } = useAuth();
  const isAdmin = hasRole("administrador");
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  async function load() {
    const { data: profiles } = await supabase.from("profiles").select("*").order("nome");
    const { data: roles } = await supabase.from("user_roles").select("user_id,role,id");
    const map: Record<string, any[]> = {};
    (roles ?? []).forEach((r: any) => { (map[r.user_id] ||= []).push(r); });
    setUsers((profiles ?? []).map((p: any) => ({ ...p, roles: map[p.id] ?? [] })));
  }

  async function changeRole(userId: string, currentRoleId: string | undefined, newRole: string) {
    if (currentRoleId) await supabase.from("user_roles").delete().eq("id", currentRoleId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
    if (error) toast.error(error.message);
    else { toast.success("Perfil atualizado."); load(); }
  }

  return (
    <>
      <PageHeader breadcrumb={["Início", "Configurações"]} title="Configurações" />

      <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-semibold mb-2">Sua conta</h2>
        <p className="text-sm"><span className="text-muted-foreground">Nome:</span> {profile?.nome}</p>
        <p className="text-sm"><span className="text-muted-foreground">E-mail:</span> {profile?.email}</p>
      </div>

      {isAdmin ? (
        <div className="bg-card border rounded-xl shadow-sm">
          <div className="px-5 py-3 border-b font-semibold">Usuários e perfis</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr><th className="text-left px-4 py-2">Nome</th><th className="text-left px-4 py-2">E-mail</th><th className="text-left px-4 py-2">Perfil</th></tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const cur = u.roles[0];
                  return (
                    <tr key={u.id} className="border-t">
                      <td className="px-4 py-2 font-medium">{u.nome}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">
                        <Select value={cur?.role ?? ""} onValueChange={(v) => changeRole(u.id, cur?.id, v)}>
                          <SelectTrigger className="w-44"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Apenas administradores podem gerenciar usuários.</p>
      )}
    </>
  );
}
