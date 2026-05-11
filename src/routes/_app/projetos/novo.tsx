import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { projetoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/projetos/novo")({
  component: () => (
    <ResourceForm table="projetos" basePath="/projetos"
      title="Novo projeto" breadcrumb={["Início", "Projetos", "Novo"]}
      fields={projetoFields}
    />
  ),
});
