import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { atividadeFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/atividades/$id/editar")({
  component: () => {
    const { id } = Route.useParams();
    return <ResourceForm id={id} table="atividades" basePath="/atividades"
      title="Editar atividade" breadcrumb={["Início", "Atividades", "Editar"]} fields={atividadeFields} />;
  },
});
