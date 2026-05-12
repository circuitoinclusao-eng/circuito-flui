import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "administrador" | "coordenador" | "professor" | "colaborador" | "consulta";

export const ROLE_LABELS: Record<Role, string> = {
  administrador: "Administrador",
  coordenador: "Coordenador",
  professor: "Professor",
  colaborador: "Colaborador / Voluntário",
  consulta: "Consulta",
};

export type ProfileStatus = "pendente" | "aprovado" | "bloqueado";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: Role[];
  profile: { nome: string; email: string; status: ProfileStatus } | null;
  status: ProfileStatus | null;
  isApproved: boolean;
  hasRole: (r: Role) => boolean;
  canEdit: boolean;
  isAdminOrCoord: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profile, setProfile] = useState<{ nome: string; email: string; status: ProfileStatus } | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadUserData(s.user.id), 0);
      } else {
        setRoles([]);
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadUserData(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadUserData(uid: string) {
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("nome,email,status").eq("id", uid).maybeSingle(),
    ]);
    setRoles((r ?? []).map((x: any) => x.role as Role));
    setProfile(p ? { nome: (p as any).nome, email: (p as any).email, status: ((p as any).status ?? "pendente") as ProfileStatus } : null);
  }

  const status = profile?.status ?? null;
  const isApproved = status === "aprovado";
  const hasRole = (r: Role) => isApproved && roles.includes(r);
  const isAdminOrCoord = isApproved && roles.some((r) => r === "administrador" || r === "coordenador");
  const canEdit = isApproved && roles.some((r) => r === "administrador" || r === "coordenador" || r === "colaborador" || r === "professor");

  return (
    <Ctx.Provider
      value={{
        user, session, loading, roles, profile, status, isApproved,
        hasRole, canEdit, isAdminOrCoord,
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
