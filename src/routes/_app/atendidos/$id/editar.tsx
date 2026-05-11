import { createFileRoute, Link } from "@tanstack/react-router";
import { AtendidoForm } from "@/components/AtendidoForm";

export const Route = createFileRoute("/_app/atendidos/$id/editar")({ component: EditarAtendido });

function EditarAtendido() {
  const { id } = Route.useParams();
  return (
    <>
      <nav className="text-xs text-muted-foreground mb-2">
        Início › <Link to="/atendidos" className="hover:underline">Atendidos</Link> › Editar
      </nav>
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">Editar Atendido</h1>
      <AtendidoForm id={id} />
    </>
  );
}
