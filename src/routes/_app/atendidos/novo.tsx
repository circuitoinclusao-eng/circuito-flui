import { createFileRoute, Link } from "@tanstack/react-router";
import { AtendidoForm } from "@/components/AtendidoForm";

export const Route = createFileRoute("/_app/atendidos/novo")({ component: NovoAtendido });

function NovoAtendido() {
  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">
        Início › <Link to="/atendidos" className="hover:underline">Atendidos</Link> › Novo
      </nav>
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">Novo Atendido</h1>
      <AtendidoForm />
    </>
  );
}
