import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { editalFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/editais/$id/editar")({
  component: () => {
    const { id } = Route.useParams();
    return (
      <ResourceForm id={id} table="editais" basePath="/editais"
        title="Editar edital" breadcrumb={["Início", "Editais", "Editar"]}
        fields={editalFields}
      />
    );
  },
});
