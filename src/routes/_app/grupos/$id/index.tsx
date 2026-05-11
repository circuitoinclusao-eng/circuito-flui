import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { grupoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/grupos/$id/")({
  component: () => {
    const { id } = Route.useParams();
    return <ResourceForm id={id} table="grupos" basePath="/grupos"
      title="Grupo / turma" breadcrumb={["Início", "Grupos", "Detalhe"]} fields={grupoFields} />;
  },
});
