import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) nav({ to: "/" });
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-soft via-background to-secondary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-primary text-primary-foreground items-center justify-center font-bold text-xl shadow-lg">
            CI
          </div>
          <h1 className="mt-3 text-2xl font-bold">Gestor Circuito Inclusão</h1>
          <p className="text-sm text-muted-foreground">Acesse para gerenciar projetos, atividades e relatórios.</p>
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-6">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><LoginForm /></TabsContent>
            <TabsContent value="signup"><SignupForm /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Bem-vindo(a)!"); nav({ to: "/" }); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="pw">Senha</Label>
        <Input id="pw" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

function SignupForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    // Não manter o usuário pendente logado
    await supabase.auth.signOut();
    setBusy(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="text-center space-y-3 py-2">
        <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
          ✓
        </div>
        <h3 className="font-semibold">Cadastro recebido</h3>
        <p className="text-sm text-muted-foreground">
          Aguarde aprovação de um administrador. Você poderá entrar assim que sua conta for liberada.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="email2">E-mail</Label>
        <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="pw2">Senha</Label>
        <Input id="pw2" type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Enviando..." : "Solicitar acesso"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Novos cadastros ficam pendentes até serem aprovados por um administrador.
      </p>
    </form>
  );
}
