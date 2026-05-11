import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { atendimentoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/atendimentos/$id/")({
  component: () => {
    const { id } = Route.useParams();
    return <ResourceForm id={id} table="atendimentos" basePath="/atendimentos"
      title="Atendimento" breadcrumb={["Início", "Atendimentos", "Detalhe"]} fields={atendimentoFields} />;
  },
});
