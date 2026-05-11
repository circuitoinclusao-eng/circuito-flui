import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { contatoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/contatos/$id/editar")({
  component: () => {
    const { id } = Route.useParams();
    return <ResourceForm id={id} table="contatos" basePath="/contatos"
      title="Editar contato" breadcrumb={["Início", "Contatos", "Editar"]} fields={contatoFields} />;
  },
});
