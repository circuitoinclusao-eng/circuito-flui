import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { atendimentoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/atendimentos/novo")({
  component: () => (
    <ResourceForm table="atendimentos" basePath="/atendimentos"
      title="Novo atendimento" breadcrumb={["Início", "Atendimentos", "Novo"]}
      fields={atendimentoFields}
    />
  ),
});
