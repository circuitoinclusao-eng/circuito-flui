import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { grupoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/grupos/novo")({
  component: () => (
    <ResourceForm table="grupos" basePath="/grupos"
      title="Novo grupo / turma" breadcrumb={["Início", "Grupos", "Novo"]} fields={grupoFields} />
  ),
});
