import { createFileRoute, Link } from "@tanstack/react-router";
import { AtividadeForm } from "@/components/atividades/AtividadeForm";

export const Route = createFileRoute("/_app/atividades/novo")({
  component: NovaAtividade,
});

function NovaAtividade() {
  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">
        Início › <Link to="/atividades" className="hover:underline">Atividades</Link> › Nova
      </nav>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Nova atividade</h1>
      <AtividadeForm />
    </>
  );
}
