import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { atendimentoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/atendimentos/$id/editar")({
  component: () => {
    const { id } = Route.useParams();
    return <ResourceForm id={id} table="atendimentos" basePath="/atendimentos"
      title="Editar atendimento" breadcrumb={["Início", "Atendimentos", "Editar"]} fields={atendimentoFields} />;
  },
});
