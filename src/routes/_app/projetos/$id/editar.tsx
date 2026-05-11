import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { projetoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/projetos/$id/editar")({
  component: () => {
    const { id } = Route.useParams();
    return <ResourceForm id={id} table="projetos" basePath="/projetos"
      title="Editar projeto" breadcrumb={["Início", "Projetos", "Editar"]}
      fields={projetoFields} />;
  },
});
