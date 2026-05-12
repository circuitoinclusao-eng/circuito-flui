import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert, LogOut } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { user, loading, status, signOut, profile } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }
  if (!user) return null;

  if (status !== "aprovado") {
    const isBloqueado = status === "bloqueado";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-soft via-background to-secondary px-4">
        <div className="max-w-md w-full bg-card border rounded-2xl shadow-sm p-8 text-center">
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 ${isBloqueado ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            {isBloqueado ? <ShieldAlert className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
          </div>
          <h1 className="text-xl font-semibold mb-2">
            {isBloqueado ? "Acesso bloqueado" : "Cadastro pendente de aprovação"}
          </h1>
          <p className="text-sm text-muted-foreground mb-1">
            {isBloqueado
              ? "Sua conta foi bloqueada. Procure um administrador do sistema."
              : "Cadastro recebido. Aguarde aprovação de um administrador."}
          </p>
          {profile?.email && (
            <p className="text-xs text-muted-foreground mb-6">Conta: {profile.email}</p>
          )}
          <Button variant="outline" className="w-full" onClick={() => signOut().then(() => nav({ to: "/auth" }))}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </div>
    );
  }

  return <AppLayout />;
}
