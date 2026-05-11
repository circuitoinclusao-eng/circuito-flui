import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { grupoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/grupos/$id/editar")({
  component: () => {
    const { id } = Route.useParams();
    return <ResourceForm id={id} table="grupos" basePath="/grupos"
      title="Editar grupo" breadcrumb={["Início", "Grupos", "Editar"]} fields={grupoFields} />;
  },
});
